import { createTransport } from 'nodemailer';
import { MailOptions } from 'nodemailer/lib/json-transport';


const EMAIL = 'scrabble922@gmail.com';
const PASSWORD = 'obnyjbqhlwyamlgn';


export const transporter = createTransport({
    service: 'gmail',
    auth: {
        user : EMAIL,
        pass: PASSWORD,
    },
});

export const createMailOptions = (emailDestination: string): MailOptions => {
    return {
        from: EMAIL,
        to: emailDestination,
    } as MailOptions;
};
