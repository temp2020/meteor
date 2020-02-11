import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

Meteor.methods({
  //Generate activity feed for user.
  'insertFeed': function(action, recUser, listing, linkid) {
    check(this.userId, String);
    check(action, String);
    check(recUser, String);
    check(listing, Match.OneOf(String, null) );
    check(linkid, Match.OneOf(String, null) );
    
    let type = '';
    let feedmsg = '';
    let listingTitle = ''    
    let username = Meteor.users.findOne({ _id: this.userId }).username;

    if( listing !== null ) {
      listingTitle = '<b>' + listing + '</b>';
    } else {
      listingTitle = null;
    }    

    switch (action) {
      case 'newOffer':
        type = 'mypost';
        feedmsg = 'MESSAGE.FEED.NEW_OFFER';
        break;

        case 'changeOffer':
          type = 'mypost';
          feedmsg = 'MESSAGE.FEED.CHANGE_OFFER';
          break;

        case 'removeBuyer':
          type = null;
          feedmsg = 'MESSAGE.FEED.REMOVE_BUYER';
          break;

        case 'postFeedback':
          type = 'profile';
          feedmsg = 'MESSAGE.FEED.POST_FEEDBACK';
          break;

        case 'changePrice':
          type = 'listing';
          feedmsg = 'MESSAGE.FEED.CHANGE_PRICE';
          break;

        case 'updatePost':
          type = 'listing';
          feedmsg = 'MESSAGE.FEED.UPDATE_POST';
          break;

        case 'soldProduct':
          type = null;
          feedmsg = 'MESSAGE.FEED.SOLD_PRODUCT';
          break;

        case 'removePost':
          type = null;
          feedmsg = 'MESSAGE.FEED.REMOVE_POST';
          break;
        }
        Feeds.insert({
          userID: recUser,
          postDate: new Date(),
          actionBy: '<b>' + username + '</b>',
          listingTitle: listingTitle,
          linkID: linkid,
          linkType: type,
          body: feedmsg,
          read: false,
        });
      }
});
