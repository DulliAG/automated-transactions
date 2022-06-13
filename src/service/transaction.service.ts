import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';
import { TransactionExecutionType } from '../interface/planned-transaction.interface';

export class TransactionService {
  private COOKIES = {
    XSRF: `XSRF-TOKEN=${process.env.XSRF!}`,
    LARAVEL: `laravel_session=${process.env.LARAVEL!}`,
  };

  private OPTIONS = {
    // method: 'POST',
    headers: {
      cookie: `${this.COOKIES.XSRF} ${this.COOKIES.LARAVEL}`,
    },
  };

  private TOKEN = process.env.TRANSFER_TOKEN!;

  static shouldExecuteTransaction(
    type: TransactionExecutionType,
    startDate: Date,
    now: Date = new Date()
  ) {
    const DAILY_EXECUTION = type === 'DAILY';

    // Check if 7 days since the start of the execution have been passed
    // If this is the case, the next transaction should been sent
    const WEEKLY_EXECUTION = type === 'WEEKLY' && (now.getDate() - startDate.getDate()) % 7 === 0;

    // Check if a month has passed since the last transaction
    const MONTHLY_EXECUTION =
      type === 'MONTHLY' &&
      startDate.getMonth() === now.getMonth() + 1 &&
      startDate.getDate() === startDate.getDate();

    // If we're processing an planned transaction the start_date and end_date are equal and represent the execution date
    const PLANNED_EXECUTION = type === 'PLANNED' && startDate.getDate() === now.getDate();

    return DAILY_EXECUTION || WEEKLY_EXECUTION || MONTHLY_EXECUTION || PLANNED_EXECUTION;
  }

  getTransactions = (iban: string, options = this.OPTIONS) => {
    return new Promise((res, rej) => {
      axios
        .post(`https://info.realliferpg.de/banking/${iban}/data`, {}, options)
        .then((response) => res(response.data))
        .catch((err) => rej(err));
    });
  };

  transfer = (
    iban: string,
    { target, amount, info }: { target: string; amount: number; info: string },
    token = this.TOKEN,
    options = this.OPTIONS
  ): Promise<string> => {
    return new Promise((res, rej) => {
      axios
        .post(
          `https://info.realliferpg.de/banking/${iban}`,
          {
            _token: token,
            type: 'init_transaction',
            amount: amount.toString(),
            iban: target,
            info: info,
          },
          options
        )
        .then((response) => {
          const RESULT = response.data;

          if (!RESULT.includes('Deine Überweisung wurde aufgegeben und durchgeführt!')) {
            if (RESULT.includes('Falsches IBAN-Format!')) throw new Error('Falsches IBAN-Format!');

            if (RESULT.includes('Zu wenig Geld auf dem Konto!'))
              throw new Error('Zu wenig Geld auf dem Konto!');

            if (RESULT.includes('Zielkonto existiert nicht'))
              throw new Error('Zielkonto existiert nicht!');

            console.log(RESULT);
            throw new Error('Ein unbekannter Fehler ist aufgetreten!');
          }

          res('Das Geld wurde überwiesen');
        })
        .catch((err) => rej(err));
    });
  };
}
