import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Mail from '../../lib/Mail';

class SubscriptionMail {
  get key() {
    return 'SubscriptionMail';
  }

  async handle({ data }) {
    const { meetup, user } = data;

    await Mail.sendMail({
      to: `${meetup.User.name} <${meetup.User.email}>`,
      subject: 'Nova inscrição',
      template: 'user-subscription',
      context: {
        organizer: meetup.User.name,
        meetup: meetup.title,
        date: format(parseISO(meetup.date), "'Dia' d 'de' MMMM', às' H:mm'h'", {
          locale: pt,
        }),
        userName: user.name,
        userEmail: user.email,
      },
    });
  }
}

export default new SubscriptionMail();
