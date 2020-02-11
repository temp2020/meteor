import { Meteor } from 'meteor/meteor';

Meteor.methods({
    'updateStoreImage': function(storeId, imageId){
        check(this.userId, String);
        check(storeId, String);
        check(imageId, String);

        let image = StoreImage.findOne({ _id: imageId });
        let store = Stores.findOne({ _id: storeId });

        if( Meteor.isServer ){
            Stores.update({
                _id: storeId,
                userId: this.userId
            },{
                $set:{
                    imageId: imageId,
                    imageLink: image.link()
                }
            }, function(err){
                if(!err && store.imageId ){
                    StoreImage.remove({ _id: store.imageId });
                }
            });
        }
    },
    'updateStoreName': function(storeId, storeData){
      check(this.userId, String);
      check(storeId, String);
      check(storeData, {
        name: String,
        description: Match.OneOf(null, String)
      });

      const { name, description } = storeData;

      let userPack = UserPack.findOne({ userId: this.userId });

      let forbidden = [
        'google',
        'adidas',
        'facebook',
        'Google',
        'Adidas',
        'Facebook',
        'tapshop'
      ];

      let existingNames = Stores.find({
        nameText: name.toLowerCase(),
        userId: { $ne: this.userId }
      })
      .count();
        
      let forbiddenMatch = 0;

      forbidden.forEach( function(word){
        if( name.toLowerCase().indexOf(word) !== -1 ){
          forbiddenMatch++;
        }
      });

      if( forbiddenMatch > 0 || forbidden.indexOf( name.toLowerCase() ) !== -1 || existingNames !== 0 ){
          throw new Meteor.Error('Name Forbidden');
      }

      return Stores.update({
        _id: storeId,
        userId: this.userId
      },{
        $set:{
          name,
          nameText: name.toLowerCase(),
          active: userPack.hasStore ? true : false,
          description
        }
      });

    },

    'removeStore': function(storeId){
        check(this.userId, String);
        check(storeId, String);

        let store = Stores.findOne({ _id: storeId, userId: this.userId });

        if(Meteor.isServer){
            Stores.update({
                _id: store._id,
                userId: store.userId
            },{
                $set:{
                    name: null,
                    nameText: null,
                    active: false,
                    imageId: null,
                    imageLink: '/images/utils/store.png'
                }
            },function(err){
                if(!err && store.imageId ){
                    StoreImage.remove({ _id: store.imageId });
                }
            });
        }
    },

    'favoriteStore': function(storeId){
        check(this.userId, String);
        check(storeId, String);

        if(!this.userId){
            return;
        }

        let favorite = Favorites.findOne({
            userId: this.userId,
            storeId: storeId
         });

         if( favorite ){

            Favorites.remove({ _id: favorite._id });
            return;
         }
         else {

            Favorites.insert({
                userId: this.userId,
                storeId: storeId,
                date: new Date()
            });

            return;
         }
    }
});
