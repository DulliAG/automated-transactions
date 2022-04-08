import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';

export class TransactionService {
  private COOKIES = {
    XSRF: `laravel_session=${process.env.XSRF!}`,
    LARAVEL: `laravel_session=${process.env.LARAVEL!}`,
  };

  private OPTIONS = {
    // method: 'POST',
    headers: {
      cookie: `${this.COOKIES.XSRF} ${this.COOKIES.LARAVEL}`,
    },
  };

  private TOKEN = process.env.TRANSFER_TOKEN!;

  getTransactions = (iban: string, options = this.OPTIONS) => {
    return new Promise((res, rej) => {
      axios
        .post(`https://info.realliferpg.de/banking/${iban}/data`, {}, options)
        .then((response) => res(response.data))
        .catch((err) => rej(err));
    });
  };

  transferMoney = (
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

            throw new Error('Ein unbekannter Fehler ist aufgetreten!');
          }

          res('Das Geld wurde überwiesen');
        })
        .catch((err) => rej(err));
    });
  };
}
