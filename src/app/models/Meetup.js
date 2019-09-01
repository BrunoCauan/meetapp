import Sequelize, { Model } from 'sequelize';
import { isBefore, subHours } from 'date-fns';

class Meetup extends Model {
  static init(sequelize) {
    super.init(
      {
        title: Sequelize.STRING,
        description: Sequelize.STRING,
        location: Sequelize.STRING,
        date: Sequelize.DATE,
        past: {
          type: Sequelize.VIRTUAL,
          get() {
            return isBefore(subHours(this.date, -3), new Date());
          },
        },
      },
      {
        sequelize,
      }
    );

    return this;
  }

  static associate(models) {
    this.hasMany(models.Subscription, { foreignKey: 'meetup_id' });
    this.belongsTo(models.File, { foreignKey: 'image_id', as: 'image' });
    this.belongsTo(models.User, { foreignKey: 'user_id', as: 'organizer' });
  }
}

export default Meetup;
