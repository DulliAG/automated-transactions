import dotenv from 'dotenv';
dotenv.config();
import { CronJob } from 'cron';
import { format } from 'date-fns';

import { client } from './service/log.service';
import { supabase } from './supabase';
import { Transaction } from './interface/transaction.interface';
import { TransactionService } from './service/transaction.service';
import { PRODUCTION } from './constants';

const TRANSACTION_TIMEOUT = 500;

client.log('LOG', 'Setup', `Starting ${process.env.APPLICATION}...`);
const processTransactions = new CronJob('0 1 * * *', async () => {
  try {
    client.log('LOG', 'Retrieve transactions', 'Rufe Daten aus der Datenbank ab');
    const { data, error } = await supabase
      .from<Transaction>('bkr_transaction')
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

    const transactionsForExecution = data.filter((transaction) =>
      TransactionService.validate(
        transaction.sender,
        { target: transaction.receiver, amount: transaction.balance, info: transaction.note },
        transaction.bkr_execution
      )
    );
    await client.log(
      'LOG',
      'Process transactions',
      JSON.stringify({
        message: 'Auswerten der gültigen Transaktionen',
        transactions: transactionsForExecution,
      })
    );

    // Execute transactions
    const transactionService = new TransactionService();
    transactionsForExecution.forEach((transaction, index) => {
      setTimeout(async () => {
        let options = {
          target: transaction.receiver,
          amount: transaction.balance,
          info: transaction.note,
        };
        if (!PRODUCTION) options.amount = 1; // Because we don't wanna spent or loose all our money we're only gonna transfer 1 $ per transaction
        return transactionService
          .transfer(transaction.sender, options)
          .then((result) => {
            client.log(
              'LOG',
              'Transfer money',
              JSON.stringify({ id: transaction.id, details: options, message: result })
            );
          })
          .catch((err) => client.log('ERROR', 'Transfer money', err));
      }, index * TRANSACTION_TIMEOUT);
    });
  } catch (error) {
    // @ts-expect-error
    client.log('ERROR', 'Uncategorized', error);
  }
});

if (!PRODUCTION) processTransactions.fireOnTick();
processTransactions.start();
