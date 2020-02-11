import { Mongo } from 'meteor/mongo';

Products = new Mongo.Collection('products');  // Products or category data for listings.
Listings = new Mongo.Collection('listing'); // Listings data.
Offers = new Mongo.Collection('offers'); // Offers data for each listing.
Profile = new Mongo.Collection('profile');  // User profile data for public viewing. (Meteor.user Data is private.)
ChatRoom = new Mongo.Collection('chatroom'); // Chat data for each user.
Messages = new Mongo.Collection('messages'); // Messages data for each Chat.
Feedback = new Mongo.Collection('feedback'); // Feedback data for each User.
Feeds = new Mongo.Collection('feeds'); // Activity feed data for each user.
Stores = new Mongo.Collection('stores'); // Each user can create a store to sell its products (there is a list of forbidden names).
Favorites = new Mongo.Collection('favorites'); // Favorites are favorite stores selected (saved) by users
Follows = new Mongo.Collection('follows'); // Follows are the products favorites selected (saved) by users
Currencies = new Mongo.Collection('currencies'); 
UserPack = new Mongo.Collection('userPack');
Packs = new Mongo.Collection('packs');
Transactions = new Mongo.Collection('transactions');
Cards = new Mongo.Collection('cards');
UserCards = new Mongo.Collection('user_cards'); // Pub Cards
Coins = new Mongo.Collection('coins');
SearchCards = new Mongo.Collection('search_cards');
UserSearchCards = new Mongo.Collection('user_search_cards');



if (Meteor.isServer) {
  Profile._ensureIndex({
    "location": "2dsphere"
  });
  Listings._ensureIndex({
    "location": "2dsphere"
  });
}

SearchCards.deny({
  insert: function(){
      return true;
  },
  update: function(){
      return true;
  },
  remove: function(){
      return true;
  }
});

UserSearchCards.deny({
  insert: function(){
      return true;
  },
  update: function(){
      return true;
  },
  remove: function(){
      return true;
  }
});

Coins.deny({
    insert: function(){
        return true;
    },
    update: function(){
        return true;
    },
    remove: function(){
        return true;
    },
});

UserCards.deny({
    insert: function(){
        return true;
    },
    update: function(){
        return true;
    },
    remove: function(){
        return true;
    },
});

Cards.deny({
    insert: function(){
        return true;
    },
    update: function(){
        return true;
    },
    remove: function(){
        return true;
    },
});

Transactions.deny({
    insert: function(){
        return true;
    },
    update: function(){
        return true;
    },
    remove: function(){
        return true;
    },
});

Packs.deny({
    insert: function(){
        return true;
    },
    update: function(){
        return true;
    },
    remove: function(){
        return true;
    },
});

UserPack.deny({
    insert: function(){
        return true;
    },
    update: function(){
        return true;
    },
    remove: function(){
        return true;
    },
});

Follows.deny({
    insert: function(){
        return true;
    },
    update: function(){
        return true;
    },
    remove: function(){
        return true;
    },
});

Favorites.deny({
    insert: function(){
        return true;
    },
    update: function(){
        return true;
    },
    remove: function(){
        return true;
    },
});

Stores.deny({
    insert: function(){
        return true;
    },
    update: function(){
        return true;
    },
    remove: function(){
        return true;
    },
});

Products.deny({
    insert: function(){
        return true;
    },
    update: function(){
        return true;
    },
    remove: function(){
        return true;
    },
});

Listings.deny({
    insert: function(){
        return true;
    },
    update: function(){
        return true;
    },
    remove: function(){
        return true;
    },
});

Offers.deny({
    insert: function(){
        return true;
    },
    update: function(){
        return true;
    },
    remove: function(){
        return true;
    },
});

Profile.deny({
    insert: function(){
        return true;
    },
    update: function(){
        return true;
    },
    remove: function(){
        return true;
    },
});

ChatRoom.deny({
    insert: function(){
        return true;
    },
    update: function(){
        return true;
    },
    remove: function(){
        return true;
    },
});

Messages.deny({
    insert: function(){
        return true;
    },
    update: function(){
        return true;
    },
    remove: function(){
        return true;
    },
});

Feedback.deny({
    insert: function(){
        return true;
    },
    update: function(){
        return true;
    },
    remove: function(){
        return true;
    },
});

Feeds.deny({
    insert: function(){
        return true;
    },
    update: function(){
        return true;
    },
    remove: function(){
        return true;
    },
});
