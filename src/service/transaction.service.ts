import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';
import { isSameDay, differenceInDays, addHours } from 'date-fns';
import { TransactionExecution } from '../interface/planned-transaction.interface';

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
    { type, start_date, end_date }: TransactionExecution,
    now: Date = addHours(new Date(), 2)
  ) {
    const startDate = new Date(start_date),
      endDate = new Date(end_date);

    const isInDateRange = now >= startDate && now <= endDate;

    const isStartDay = isSameDay(now, startDate);

    switch (type) {
      case 'DAILY':
        return isInDateRange;

      case 'WEEKLY':
        return isInDateRange && (isStartDay || differenceInDays(now, startDate) % 7 === 0);

      case 'MONTHLY':
        // Check if the start-date is the last day of the month
        // If this is the case we're gonna execute the transaction on the last day of the following months
        // If this is not the case the transactions is gonna get executed next month on the same date
        const getLastDateOfMonth = (year: number, month: number) =>
          new Date(year, month, 0).getDate();

        /**
         * Prüfe ob
         * - prüfe ob start-datum letzter tag des monats ist
         *   (wenn dies der fall ist soll die zahlung immer am letzten tag der folgemonate ausgeführt werden)
         */

        const lastDayOfStartMonth = getLastDateOfMonth(
          Number(start_date.split('-')[0]),
          Number(start_date.split('-')[1])
        );
        const startDateIsLastDateOfMonth = lastDayOfStartMonth === Number(start_date.split('-')[2]);
        const todayIsLastDateOfMonth =
          getLastDateOfMonth(now.getFullYear(), now.getDate()) === now.getDate();

        // e.g. 2022-02-29 would be false because the last day would be 2022-02-28
        const startMonthContainsDate =
          lastDayOfStartMonth > 0 && Number(start_date.split('-')[2]) <= lastDayOfStartMonth;
        const monthHasPassed = startDate.getDate() === now.getDate();

        return (
          isInDateRange &&
          startMonthContainsDate &&
          (isStartDay ||
            (startDateIsLastDateOfMonth && todayIsLastDateOfMonth) ||
            (!isStartDay && monthHasPassed))
        );

      case 'PLANNED':
        // If we're checking an PLANNED-execution the start- and end-date are the same.
        // If this is not the case were checking an defective transaction
        return isInDateRange && isStartDay && isSameDay(now, endDate);
    }
  }

  getTransactions(iban: string, options = this.OPTIONS) {
    return new Promise((res, rej) => {
      axios
        .post(`https://info.realliferpg.de/banking/${iban}/data`, {}, options)
        .then((response) => res(response.data))
        .catch((err) => rej(err));
    });
  }

  transfer(
    iban: string,
    { target, amount, info }: { target: string; amount: number; info: string },
    token = this.TOKEN,
    options = this.OPTIONS
  ): Promise<string> {
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
  }
}
