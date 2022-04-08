import { LogVariant } from '@dulliag/logger.js';
import { CronJob } from 'cron';
import { format } from 'date-fns';

import { createLog } from './service/log.service';
import { supabase } from './supabase';
import { IPlannedTransfer } from './interface/planned-transaction.interface';
import { TransactionService } from './service/transaction.service';

const task = new CronJob('0 1 * * *', async () => {
  createLog(LogVariant.LOG, 'Transfer', "Get today's transactions");

  const { data, error } = await supabase
    .from<IPlannedTransfer>('bb_planned_transfer')
    .select()
    .or(`type.eq.DAILY, execute_at.eq.${format(new Date(), 'yyyy-MM-dd')}`);

  if (error) {
    createLog(LogVariant.ERROR, 'Transfer', JSON.stringify(data));
    return;
  }

  data.forEach((transfer) => {
    createLog(LogVariant.INFORMATION, 'Transfer', `Processing transfer '#${transfer.id}'`);

    let options = {
      target: transfer.target,
      amount: transfer.amount,
      info: `${transfer.info} - AUTOMATED RLRPG TRANSACTIONS`,
    };

    new TransactionService()
      .transferMoney(transfer.account, options)
      .then((result) =>
        createLog(
          LogVariant.LOG,
          'Transfer',
          JSON.stringify({ id: transfer.id, details: options, message: result })
        )
      )
      .catch((error) => createLog(LogVariant.ERROR, 'Transfer', error));
  });
});

// task.fireOnTick();
task.start();
