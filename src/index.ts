import { CronJob } from 'cron';
import { format } from 'date-fns';

import { client } from './service/log.service';
import { supabase } from './supabase';
import { ITransaction } from './interface/planned-transaction.interface';
import { TransactionService } from './service/transaction.service';
import { PRODUCTION } from './constants';

const TRANSACTION_TIMEOUT = 500;

const processTransactions = new CronJob('0 1 * * *', async () => {
  try {
    client.log('LOG', 'Retrieve transactions', 'Rufe Daten aus der Datenbank ab');
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

    client.log('LOG', 'Process transactions', 'Auswerten der gültigen Transaktionen');
    // Filter transactions which are not daily, weekly, monthly or planned for today
    data
      .filter((transaction) => {
        if (transaction.sender === transaction.receiver)
          throw 'Der Sender darf nicht der Empfänger sein';

        return transaction;
      })
      .filter((transaction) =>
        TransactionService.shouldExecuteTransaction(transaction.bkr_execution)
      )
      .forEach((transaction, index) => {
        setTimeout(() => {
          let options = {
            target: transaction.receiver,
            amount: transaction.balance,
            info: transaction.note,
          };
          if (!PRODUCTION) {
            client.log(
              'LOG',
              'Transfer money',
              JSON.stringify({ id: transaction.id, details: options, message: 'Money transfered' })
            );
            return;
          }
          new TransactionService()
            .transfer(transaction.sender, options)
            .then((result) => {
              console.log(result);
              client.log(
                'LOG',
                'Transfer money',
                JSON.stringify({ id: transaction.id, details: options, message: result })
              );
            })
            .catch((error) => client.log('ERROR', 'Transfer money', error));
        }, index * TRANSACTION_TIMEOUT);
      });
  } catch (error) {
    // @ts-expect-error
    client.log('ERROR', 'Uncategorized', error);
  } finally {
    client.log('INFORMATION', 'Processing transactions', 'Verarbeiten der Transaktionen beendet');
  }
});

if (!PRODUCTION) processTransactions.fireOnTick();
processTransactions.start();
