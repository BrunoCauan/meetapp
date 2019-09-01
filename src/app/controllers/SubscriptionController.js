import { Op } from 'sequelize';

import Subscription from '../models/Subscription';
import User from '../models/User';
import Meetup from '../models/Meetup';

import SubscriptionMail from '../jobs/SubscriptionMail';
import Queue from '../../lib/Queue';

class SubscriptionController {
  async index(req, res) {
    const subscriptions = await Subscription.findAll({
      where: {
        user_id: req.userId,
      },
      attributes: ['id'],
      include: [
        {
          model: Meetup,
          as: 'meetup',
          where: {
            date: {
              [Op.gt]: new Date(),
            },
          },
          attributes: ['id', 'title', 'description', 'location', 'date'],
          required: true,
        },
      ],
      order: [['meetup', 'date']],
    });

    return res.json(subscriptions);
  }

  async store(req, res) {
    const user = await User.findByPk(req.userId);
    const meetup = await Meetup.findByPk(req.params.meetupId, {
      include: [User],
    });

    if (!meetup) {
      return res
        .status(400)
        .json({ error: `Not found Meetup with id: ${req.params.meetupId}` });
    }

    if (meetup.user_id === req.userId) {
      return res
        .status(400)
        .json({ error: 'You can not subscribe to your own Meetup' });
    }

    if (meetup.past) {
      return res
        .status(400)
        .json({ error: 'You can not subscribe to past Meetups' });
    }

    const hasSubscribed = await Subscription.findOne({
      where: {
        user_id: req.userId,
        meetup_id: req.params.meetupId,
      },
    });

    if (hasSubscribed) {
      return res
        .status(400)
        .json({ error: 'You have already subscribed for this Meetup' });
    }

    const checkDate = await Subscription.findOne({
      where: {
        user_id: req.userId,
      },
      include: [
        {
          model: Meetup,
          required: true,
          where: {
            date: meetup.date,
          },
        },
      ],
    });

    if (checkDate) {
      return res
        .status(400)
        .json({ error: 'Can not subscribe to two Meetups at the same time' });
    }

    const subscription = await Subscription.create({
      meetup_id: req.params.meetupId,
      user_id: req.userId,
    });

    await Queue.add(SubscriptionMail.key, {
      meetup,
      user,
    });

    return res.json(subscription);
  }
}

export default new SubscriptionController();
