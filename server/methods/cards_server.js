import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

Meteor.methods({
    'updateCardLevel': function() {
        if(!this.userId) return;
        check(this.userId, String);
        
        const userCard = UserCards.findOne({ userId: this.userId });
        
        const listing = Listings.findOne({ listedBy: this.userId }, { 
          sort: {
            postDate: -1
          }
        });

        if(!listing){
          return;
        }

        const currentDate = Date.now();

        const lastPost = listing.postDate.getTime();

        const hour = 60000 * 60;

        const lastPostHours = (currentDate - lastPost) / hour;

        const downGradeLevel = Math.floor(lastPostHours / 24);
        
        if(downGradeLevel < 1){
          return;
        };

        let updatedCard = userCard.baseLevel - downGradeLevel;

        if(updatedCard === userCard.level){
          return;
        }

        if(updatedCard < 0){
          updatedCard = 0;
        }

        return UserCards.update({ _id: userCard._id },{
          $set: {
            level: updatedCard,
            latestListingId: listing._id,
            lastUpdate: new Date()
          }
        });
    },
    'selectSearchCard': function(cardId) {
      check(this.userId, String);
      check(cardId, String);

      const currentDate = new Date();

      const card = SearchCards.findOne({ _id: cardId });
      const coins = Coins.findOne({ userId: this.userId });
      const selectedPack = UserPack.findOne({ userId: this.userId });
      const selectedCard = UserSearchCards.findOne({ userId: this.userId });
      
      if ( 
        selectedCard.name === card.name && 
        (selectedCard.expiry === null || currentDate < selectedCard.expiry)
      ) {
        throw new Meteor.Error('Card already purchased');
      }

      const isFree = card.cost === 0 || selectedPack.name === card.freePack
        ? true
        : false;

      if (!isFree && coins.quantity < card.cost) {
        throw new Meteor.Error('Insufficient Coins');
      }

      return Coins.update({ _id: coins._id }, {
        $inc: {
          quantity: isFree ? 0 : -card.cost
        }
      }, 
      function(err){
        if(err) {
          return;
        }

        const expiryDays = card.expiryDays
          ? currentDate.getTime() + (3600000 * 24 * card.expiryDays)
          : null;

        UserSearchCards.update({ _id: selectedCard._id }, {
          $set: {
            name: card.name,
            distance: card.value,
            expiry: expiryDays ? new Date(expiryDays) : null,
            lastUpdate: currentDate
          }
        });
      });

    },
    'updateExpiredSearchCard': function() {
      if(!this.userId) {
        return
      }

      check(this.userId, String);

      const currentDate = new Date();
      const selectedCard = UserSearchCards.findOne({ userId: this.userId });

      const isExpired = selectedCard.expiry !== null 
        && currentDate >= selectedCard.expiry;

      if (selectedCard.expiry === null || !isExpired) {
        return;
      }

      UserSearchCards.update({ _id: selectedCard._id }, {
        $set: {
          name: null,
          expiry: null,
          distance: null,
          lastUpdate: currentDate
        }
      });
    }
});