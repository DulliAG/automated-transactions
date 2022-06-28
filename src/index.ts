import { LogVariant } from '@dulliag/logger.js';
import { CronJob } from 'cron';
import { format } from 'date-fns';

import { createLog } from './service/log.service';
import { supabase } from './supabase';
import { ITransaction } from './interface/planned-transaction.interface';
import { TransactionService } from './service/transaction.service';

const TRANSACTION_TIMEOUT = 500;

const processTransactions = new CronJob('0 1 * * *', async () => {
  try {
    createLog(LogVariant.LOG, 'Retrieve transactions', 'Rufe Daten aus der Datenbank ab');
    const { data, error } = await supabase
      .from<ITransaction>('bkr_transaction')
      .select(
        `
          id,
          sender,
          receiver,
          balance, 
          note,
          bkr_execution!inner (
            id,
            type,
            start_date,
            end_date
          ) 
        `
      )
      // If we're processing an planned execution the start_date and the end_date are equal and represent the execution_date
      .lte(
        // @ts-expect-error
        'bkr_execution.start_date',
        format(new Date(), 'yyyy-MM-dd')
      )
      .gte(
        // @ts-expect-error
        'bkr_execution.end_date',
        format(new Date(), 'yyyy-MM-dd')
      );
    if (error) throw error;

    createLog(LogVariant.LOG, 'Process transactions', 'Auswerten der gültigen Transaktionen');
    // Filter transactions which are not daily, weekly, monthly or planned for today
    data
      .filter((transaction) => {
        if (transaction.sender === transaction.receiver)
          throw 'Der Sender darf nicht der Empfänger sein';

        return transaction;
      })
      .filter((transaction) => {
        const { type, start_date } = transaction.bkr_execution;
        if (TransactionService.shouldExecuteTransaction(type, new Date(start_date))) {
          return transaction;
        }
      })
      .forEach((transaction, index) => {
        setTimeout(() => {
          let options = {
            target: transaction.receiver,
            amount: transaction.balance,
            info: transaction.note,
          };
          new TransactionService()
            .transfer(transaction.sender, options)
            .then((result) => {
              console.log(result);

              createLog(
                LogVariant.LOG,
                'Transfer money',
                JSON.stringify({ id: transaction.id, details: options, message: result })
              );
            })
            .catch((error) => createLog(LogVariant.ERROR, 'Transfer money', error));
        }, index * TRANSACTION_TIMEOUT);
      });
  } catch (error) {
    // @ts-expect-error
    createLog(LogVariant.ERROR, 'Uncategorized', error);
  } finally {
    createLog(
      LogVariant.INFORMATION,
      'Processing transactions',
      'Verarbeiten der Transaktionen beendet'
    );
  }
});

// processTransactions.fireOnTick();
processTransactions.start();
