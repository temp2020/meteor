import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import _ from 'underscore';
import Autolinker from 'autolinker';

Meteor.methods({

  //Create new chat for users.
  'loadChat': function(newChat, action) {
          check( this.userId, String );
          check( action, String );
          check( newChat, {
                  listingID: String,
                  prodName: String,
                  offerID: Match.OneOf(String, null)
          });
          switch (action) {
                  case 'buy now':
                          var thisPost = Listings.findOne({ _id: newChat.listingID });
                          
                          var currency = thisPost.currency;
                          var price = thisPost.sellPrice;
                          var buyerid = this.userId;
                          var buyername = Meteor.users.findOne({ _id: this.userId }).username;
                          break;

                  case 'accept':
                          var thisPost = Listings.findOne({ _id: newChat.listingID, listedBy: this.userId });
                          var offer = Offers.findOne({ _id: newChat.offerID });

                          var currency = offer.currency;
                          var price = offer.offerAmount;
                          var buyerid = offer.offerBy;
                          var buyername = offer.buyer;
                          break;
          }
          let chat = _.extend(newChat, {
                  agreedPrice: price,
                  currency: currency,
                  buyer: buyerid,
                  buyerName: buyername,
                  seller: thisPost.listedBy,
                  sellerName: thisPost.seller,
                  latestMsg: new Date(),
                  buyerActive: true,
                  sellerActive: true
          });
          return ChatRoom.insert(chat);
  },

  //Generate system message on chat.
  'systemMsg': function(action, chatID){
    check(this.userId, String);
    check(action, String);
    check(chatID, String);
    
    let thisChat = ChatRoom.findOne({
      _id: chatID,
      $or: [{
        buyer: this.userId
      },{
        seller: this.userId
      }]
    });

    let date = new Date();
    let isTransaction = false;
    let currency = null;
    let price = null;
    let listing = null;
    let sysmsg = '';
    let actionBy = '';
    let msgFor = '';

    switch (action) {
      case 'Buy':
        currency = thisChat.currency;
        price = thisChat.agreedPrice;
        sysmsg = 'MESSAGE.CHAT.BUY';
        msgFor = thisChat.seller;
        actionBy = '<b>' + thisChat.buyerName + '</b>';
        listing = '<b>' + thisChat.prodName + '</b>';
        isTransaction = true;
        break;

      case 'Accept':
        currency = thisChat.currency;
        price = thisChat.agreedPrice;
        sysmsg = 'MESSAGE.CHAT.ACCEPT';
        msgFor = thisChat.buyer;
        actionBy = '<b>' + thisChat.sellerName + '</b>';
        listing = '<b>' + thisChat.prodName + '</b>';
        isTransaction = true;
        break;

      case 'CancelBuyer':
        ChatRoom.update({ _id: thisChat._id },{ $set: { latestMsg: date }});
        sysmsg = 'MESSAGE.CHAT.LEAVE';
        msgFor = thisChat.seller;
        actionBy = '<b>' + thisChat.buyerName + '</b>';
        break;

      case 'CancelSeller':
        ChatRoom.update({ _id: thisChat._id },{ $set: { latestMsg: date }} );
        sysmsg = 'MESSAGE.CHAT.LEAVE';
        msgFor = thisChat.buyer;
        actionBy = '<b>' + thisChat.sellerName + '</b>';
        break;

      case 'Sold':
        ChatRoom.update( {_id: thisChat._id}, {$set: { latestMsg: date }} );
        sysmsg = 'MESSAGE.CHAT.SOLD';
        msgFor = thisChat.buyer;
        actionBy = '<b>' + thisChat.sellerName + '</b>';
        break;
    }

    if ( ChatRoom.findOne({ _id: chatID, $or: [{ buyer: msgFor, buyerActive: true },{ seller: msgFor, sellerActive: true }] }) ) {
      
      return Messages.insert({
        chatID: thisChat._id,
        sentBy: 'system',
        sent: date,
        for: msgFor,
        body: sysmsg,
        listing: listing,
        actionBy: actionBy,
        isTransaction: isTransaction, 
        price: price,
        currency: currency,        
        read: false
      }, function(err){
        if(!err){
          Meteor.call('sendNotification', msgFor);
          return;
        }
      });

    } else {
      console.log('Other user has left.');
      return;
    }
  },
  
  'sendMoreDetails': function(newmsg) {
    check(this.userId, String);
    check(newmsg, {
      listingId: String,
      chatId: String
    });

    const { listingId, chatId } = newmsg;

    const listing = Listings.findOne({ _id: listingId });

    const chat = ChatRoom.findOne({ _id: chatId });

    if( !chat || !listing ||  (listing && !listing.moreDetails) ) {
      return;
    }

    const seller = Meteor.users.findOne({ _id: listing.listedBy });

    const message = {
      chatID: chatId,
      sentBy: listing.listedBy,
      for: this.userId,
      user: seller.username,
      sent: new Date(),
      read: false,
      body: Autolinker.link(listing.moreDetails)
    }

    return Messages.insert(message, function(err){
      if (err) {
        throw new Meteor.Error('Error sending message.', 'Error sending message.');
      }
      else {
        Meteor.call('sendNotification', message.for);
        return;
      }
    });
  }
});
