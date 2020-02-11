import { Meteor } from 'meteor/meteor';
import { canEdit } from '../../../lib/components/publish-date';

angular
    .module('salephone')
    .controller('SellerCtrl', SellerCtrl);

 function SellerCtrl(
                      $scope,
                      $stateParams,
                      $reactive,
                      $ionicSideMenuDelegate,
                      $ionicLoading,
                      $ionicSlideBoxDelegate,
                      $ionicPopup,
                      $sce,
                      $ionicModal,
                      $state,
                      $rootScope,
                      $cordovaToast,
                      $translate,
                      $filter,
                      $window,
                      convertCurrency
                    ){

  $reactive(this).attach($scope);
  var self = this;
  this.baseCurrency = $window.localStorage.getItem('currencyBase') || 'EUR';

  this.subscribe('productSeller', () => [ $stateParams.listingId ], {
    onReady: function() {
      let post = Listings.findOne({ _id: $stateParams.listingId })
      self.subscribe('product', () => [ post.productID ], {
        onReady: function() {
          return;
        }
      });
      $ionicSlideBoxDelegate.update();
      $ionicLoading.hide();

      setTimeout(() => {
        if($stateParams.viewoffer && self.viewOffers) {
          self.viewOffers();
        }
      }, 600);
    }
  });

  this.helpers({
    listing: () => Listings.findOne({ _id: $stateParams.listingId }),
    product: () => Products.findOne({ _id: self.getReactively('listing.productID') }),
    postOffer: () => Offers.findOne({ listingID: $stateParams.listingId }, { sort: { offerAmount: -1, offerDate: 1 }}),
    offerCount: () => Offers.find({ listingID: $stateParams.listingId }).count(),
    offers: () => Offers.find({ listingID: $stateParams.listingId}, { sort: { offerAmount: -1, offerDate: 1 }})
  });

  //Get uploaded images from database.
  this.uploads = function(imgId) {
    let upload = Uploads.findOne({ _id: imgId });
    if ( upload ) {
      return upload.link();
    } else {
      return;
    }
  };

  //Render listing description as HTML.
  this.notes = function(notes) {
    return $sce.trustAsHtml(notes);
  };

  //Get profile of users that sent offers.
  this.profile = function (offerby) {
    return Profile.findOne({ profID: offerby});
  }

  //Get profile image of users that sent offers.
  this.profileImg = function (offerby) {
    return ProfileImg.findOne({ 'meta.userId': offerby });
  }

  //Image slider funciton.
  this.slideChanged = function(index) {
    $scope.slideIndex = index;
  };

  //Modal to show users with offers.
  $ionicModal.fromTemplateUrl('client/templates/product_page/view_offer.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });

  //Show modal.
  this.viewOffers = function() {
    $scope.modal.show();
    self.call('readOffer', $stateParams.listingId)
  };

  //Close modal, remove user selection.
  this.closeOffer = function() {
    this.buyer = '';
    $scope.modal.hide();
  };

  this.priceAmount = function(price, currency){
    if(!price || !currency){
      return;
    }

    return convertCurrency(price, currency, this.baseCurrency);
  } 

  this.setOfferCount = function(count){
    if(!count || count === 0){
      return '';
    }
    else if ( count === 1) {
      return 'LABEL.OFFER';
    }
    else{
      return 'LABEL.OFFERS';
    }
  }  

  //Load chat with selected user.
  this.acceptOffer = function() {
    $rootScope.$broadcast('loadspinner');
    if ( this.buyer != null || this.buyer != '' ) {

      let selectBuyer = Offers.findOne({ _id: this.buyer });

      let chatCheck = ChatRoom.find({
        listingID: self.listing._id,
        buyer: selectBuyer.offerBy,
        buyerActive: true
      }).count();

      //Check for existing chat with same user on same listing.
      if ( chatCheck !== 0 ) {

        let goChat = ChatRoom.findOne({
          listingID: self.listing._id,
          buyer: selectBuyer.offerBy,
          buyerActive: true
        });

        $scope.modal.remove();
        $state.go('app.chat', { chatId: goChat._id });
      }
      else {

        //Save chat details to object.
        let newChat = {
              listingID: self.listing._id,
              prodName: self.listing.title,
              offerID: this.buyer
        }

        //Create new chat room.
        //Method is located at tapshop/server/methods/messages_server.js
        Meteor.call('loadChat', newChat, 'accept', function(err, chatid) {
          if (!err) {
            //Method is located at tapshop/server/methods/messages_server.js
            Meteor.call('systemMsg', 'Accept', chatid);
            $scope.modal.remove();
            $state.go('app.chat', { chatId: chatid });
          }
          else {
            
            $translate('MESSAGE.TOAST.TRY_AGAIN').then(function (message) {
              if (Meteor.isCordova) {
                $cordovaToast.showLongBottom(message);
              } 
              else {
                toastr.error(message);
              }
            });

            $ionicLoading.hide();
            return;
          }
        });
      }
    }
    else {
      console.log('Please select a buyer.');
      $ionicLoading.hide();
      return;
    }
  };

  //Load popup to change selling price of this listing.
  this.changePrice = function() {
    $translate([
      'LABEL.ENTER_PRICE', 
      'LABEL.CANCEL', 
      'LABEL.UPDATE',
      'MESSAGE.TOAST.PRICE_UPDATED',
      'MESSAGE.TOAST.TRY_AGAIN', 
      'LAYOUT.STYLE',
      'MESSAGE.TOAST.CANNOT_EDIT_LISTING'
    ]).then(function (result) { 
    
      let thisPost = self.listing;
      
      /*
      if ( thisPost.firstPublishDate && !canEdit(thisPost.firstPublishDate) ) {

        if (Meteor.isCordova) {
          $cordovaToast.showShortBottom( result['MESSAGE.TOAST.CANNOT_EDIT_LISTING'] );
        } 
        else {
          toastr.error( result['MESSAGE.TOAST.CANNOT_EDIT_LISTING'] );
        }

        return;
      }
      */
      
      self.sellPrice = self.listing.sellPrice.toString();
      
      self.myPopup = $ionicPopup.show({
        template: '<input type="tel" ng-model="vm.sellPrice" autofocus>',
        cssClass: result['LAYOUT.STYLE'],
        title: result['LABEL.ENTER_PRICE'],
        scope: $scope,
        buttons: [{
          text: result['LABEL.CANCEL']
        },{
          text: '<b>' + result['LABEL.UPDATE'] + '</b>',
          type: 'button-positive',
          onTap: function(e) {
            if ( self.sellPrice ) {
              let newAmount = parseInt( self.sellPrice.replace(/,/g, '') );

              //Method is located at tapshop/lib/methods/listings.js
              Meteor.call('changePrice', thisPost._id, newAmount, function(err, success) {
                if (!err) {
                  if (Meteor.isCordova) {
                    $cordovaToast.showShortBottom( result['MESSAGE.TOAST.PRICE_UPDATED'] );
                  } 
                  else {
                    toastr.success( result['MESSAGE.TOAST.PRICE_UPDATED'] );
                  }
                  if ( Offers.find({listingID: thisPost._id}).count() !== 0 ) {
                    Offers.find({listingID: thisPost._id}).forEach( function(thisOffer) {
                      //Method is located at tapshop/server/methods/feed_server.js
                      Meteor.call('insertFeed', 'changePrice', thisOffer.offerBy, thisPost.title, thisPost._id);
                    });
                  }
                }
                else {
                  if (Meteor.isCordova) {
                    $cordovaToast.showLongBottom( result['MESSAGE.TOAST.TRY_AGAIN'] );
                  } 
                  else {
                    toastr.error( result['MESSAGE.TOAST.TRY_AGAIN'] );
                  }
                }
              });
            }
            else {
              e.preventDefault();
            }
          }
        }]
      });
    });
  };

  this.edit = function() {

    if(!self.listing) {
      return;
    }

    if ( self.listing.firstPublishDate && !canEdit(self.listing.firstPublishDate) ) {

      $translate('MESSAGE.TOAST.CANNOT_EDIT_LISTING')
        .then(function(result){
          if (Meteor.isCordova) {
            $cordovaToast.showShortBottom( result );
          } 
          else {
            toastr.error( result );
          }
        });

      return;
    }

    $state.go('app.editpost', { listingId: self.listing._id })
  }

  //Show popup to confirm deletion of listing, and delete on confirm.
  this.delete = function() {
    $translate([
      'LABEL.DELETE_POST', 
      'LABEL.DELETE_POST_CONFIRM',
      'LABEL.CANCEL', 
      'LABEL.DELETE',
      'MESSAGE.TOAST.POST_REMOVED',
      'MESSAGE.TOAST.TRY_AGAIN', 
      'LAYOUT.STYLE',
      'MESSAGE.TOAST.CANNOT_EDIT_LISTING'
    ]).then(function (result) { 
      
      let thisPost = self.listing;

      if ( thisPost.firstPublishDate && !canEdit(thisPost.firstPublishDate) ) {

        if (Meteor.isCordova) {
          $cordovaToast.showShortBottom( result['MESSAGE.TOAST.CANNOT_EDIT_LISTING'] );
        } 
        else {
          toastr.error( result['MESSAGE.TOAST.CANNOT_EDIT_LISTING'] );
        }

        return;
      }
      
    
      self.confirmPopup = $ionicPopup.confirm({
        title: result['LABEL.DELETE_POST'],
        cssClass: result['LAYOUT.STYLE'],
        template: result['LABEL.DELETE_POST_CONFIRM'],
        scope: $scope,
        buttons: [{
          text: result['LABEL.CANCEL']
        },{
          text: '<b>' + result['LABEL.DELETE'] + '</b>',
          type: 'button-assertive',
          onTap: function() {
            $rootScope.$broadcast('loadspinner');
            //Method is located at tapshop/lib/methods/listings.js
            Meteor.call('removeListing', thisPost._id, function(err) {
              if (!err) {
                if (Meteor.isCordova) {
                  $cordovaToast.showShortBottom( result['MESSAGE.TOAST.POST_REMOVED'] );
                } 
                else {
                  toastr.success( result['MESSAGE.TOAST.POST_REMOVED'] );
                }
                $state.go('app.sell');
              }
              else {
                if (Meteor.isCordova) {
                  $cordovaToast.showLongBottom( result['MESSAGE.TOAST.TRY_AGAIN'] );
                } 
                else {
                  toastr.error( result['MESSAGE.TOAST.TRY_AGAIN'] );
                  $ionicLoading.hide();
                }
              }
            })
          }
        }]
      });      
    });    
  };

  this.publishSuccess = function (toPublish) {

    $translate([
      'MESSAGE.TOAST.LISTING_PUBLISHED', 
      'MESSAGE.TOAST.LISTING_UNPUBLISHED'
    ]).then(function (messageText) {

      const message = toPublish 
        ? messageText['MESSAGE.TOAST.LISTING_PUBLISHED']
        : messageText['MESSAGE.TOAST.LISTING_UNPUBLISHED']

        if (Meteor.isCordova) {
          $cordovaToast.showLongBottom(message);
        }
        else {
          toastr.success(message);
        }

    });
  }

  this.publish = function() {
    
    $rootScope.$broadcast('loadspinner');

    const toPublish = self.listing.isPublished ? false : true;

    self.call('publish', self.listing._id, function(err) {
      
      $ionicLoading.hide();

      if(err) {

        $translate([
          'MESSAGE.TOAST.TRY_AGAIN', 
          'MESSAGE.TOAST.CANNOT_EDIT_LISTING'
        ]).then(function (messageText) {
          
          const message = err.error === 'Cannot Edit'
            ? messageText['MESSAGE.TOAST.CANNOT_EDIT_LISTING']
            : messageText['MESSAGE.TOAST.TRY_AGAIN'];

          if (Meteor.isCordova) {
            $cordovaToast.showLongBottom(message);
          }
          else {
            toastr.error(message);
          }
        });

        return;
      }

      self.publishSuccess(toPublish);

    });

  }

  this.togglePublish = function( ) {
    
    if ( self.listing.isPublished ) {
      self.publish();
      return;
    }

    self.call('checkListingCount', function(err, res){
      if( res === true ){

        if ( !self.listing.firstPublishDate ) {
          
          $translate('LABEL.PUBLISHED_LISTING').then(function (title) {

            self.publishPopup = $ionicPopup.confirm({
              title,
              buttons: [{
                text: '<b>Publish</b>',
                type: 'button-positive',
                onTap: function(e) {
                  self.publish(true);
                }
              }]
            });

          });
          return;
        }
    
        self.publish();

        return;

      } else {

        if( res === false ){

          $translate('MESSAGE.TOAST.LISTING_LIMIT').then(function (message) {
            if (Meteor.isCordova) {
              $cordovaToast.showLongBottom(message);
            }
            else {
              toastr.error(message);
            }
          });
          return;

        } else {

          $translate('MESSAGE.TOAST.TRY_AGAIN').then(function (message) {
            if (Meteor.isCordova) {
              $cordovaToast.showLongBottom(message);
            }
            else {
              toastr.error(message);
            }
          });

        }
      }
    });

  };

  this.isSeller = $state.is('app.myproduct');

  //Refresh data function.
  $scope.refresh = function() {
    $ionicSlideBoxDelegate.update();
    $state.reload('app.myproduct');
    $scope.$broadcast('scroll.refreshComplete');
  };

  $scope.$on('$ionicView.beforeLeave', function (event, viewData) {
    $scope.modal.remove();

    if( self.myPopup  ){
      self.myPopup.close();
    }

    if( self.confirmPopup  ){
      self.confirmPopup.close();
    }  

    if ( self.publishPopup ) {
      self.publishPopup.close();
    }

  });

  $scope.$on('$ionicView.afterEnter', function (event, viewData) {
    if ( document.getElementById("content-main") !== null ) {
      $ionicLoading.hide();
    }
  });
};
