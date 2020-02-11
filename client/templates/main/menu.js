import { _meteorAngular } from 'meteor/angular';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

angular
    .module('salephone')
    .controller('MenuCtrl', MenuCtrl);

function MenuCtrl (
                    $scope,
                    $reactive,
                    $state,
                    $sce,
                    $ionicViewSwitcher,
                    $ionicHistory,
                    $rootScope,
                    $ionicLoading,
                    $ionicModal,
                    geolocation,
                    $translate,
                    $ionicSideMenuDelegate,
                    moneyJs,
                    $window
                  ) {

    $reactive(this).attach($scope);
    var self = this;
    this.myprofile;

    if( !Meteor.userId() ){
      $window.localStorage.setItem( 'currencyBase', 'EUR' );
    }
    
    moneyJs.updateCurrency();

    if( window.localStorage.getItem('language') ) {
      this.language = window.localStorage.getItem('language');
      $translate.use(this.language);
    }
    else {
      this.language = 'en';
      $translate.use('en');
      window.localStorage.setItem('language', 'en');
    }

    this.subscribe('myMenu', () => [], {
      onReady: function() {
        self.call('clearExpired'); 
        return; 
      }
    });

    this.autorun( () => {
      if( !Session.get('myCoordinates') ) {

        if( window.localStorage.getItem('lat') && window.localStorage.getItem('lng') ){
          let storedCoords = {
            lat: parseFloat( window.localStorage.getItem('lat') ),
            lng: parseFloat( window.localStorage.getItem('lng') )
          }
          Session.set('myCoordinates', storedCoords);
        }

        setTimeout(function(){
          geolocation.getCurrentPosition()
            .then( function(result){
              Session.set('myCoordinates', result);

              if( self.myprofile ){
                Meteor.call('getLocation', result, function(err, location) {
                  if (!err) {
                    //Method is located at tapshop/lib/methods/profile.js
                    Meteor.call('updateLocation', location, result);
                    return;
                  }
                });
              }

              return;
            },
            function(error){
              console.log(error.message);
              return;
            });
        }, 3000);
      }
    });

    this.subscribe('unreadCount', () => [], {
      onReady: function() {
        return;
      }
    });

    this.helpers({
      myprofile: () => Profile.findOne({ profID: Meteor.userId() }),
      profileImg: () => ProfileImg.findOne({ 'meta.userId': Meteor.userId() }),
      unreadOffers: () => Offers.find({ seller: Meteor.userId(), read: false }).count(),
      unreadMsg: () => Messages.find({ for: Meteor.userId(), read: false }).count(),
      unreadTotal: () => self.getReactively('unreadOffers') + self.getReactively('unreadMsg')
    });

    this.autorun( () => {
      if( Meteor.userId() ) {

        self.call('updateCardLevel');

        let base = $window.localStorage.getItem('currencyBase');

        if( self.myprofile && base !== self.myprofile.currency ){
          
          $window.localStorage.setItem( 'currencyBase', self.myprofile.currency );
          
          console.log('Updating currencies ...');
          
          moneyJs.updateCurrency();

        }
        
      }
    });

    $ionicModal.fromTemplateUrl('client/templates/main/components/select_language.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.langModal = modal;
    });
  
    this.showLanguage = function(){
      $scope.langModal.show();
    }  
  
    this.selectLanguage = function(lang){
      $scope.langModal.hide();
      $translate.use(lang);
      self.language = lang;
      $state.reload();
      window.localStorage.setItem('language', lang);
      if(self.myprofile){
        Meteor.call('updateLanguage', lang);
      }
      return;
    }

    //Go to Shop tab.
    this.selectShop = function() {
        $ionicViewSwitcher.nextDirection("back");
        $state.go('app.shop');
    };

    //Go to Sell tab.
    this.selectSell = function() {
        if ( $state.is('app.shop') === true || $state.is('app.listings') === true  ) {
          $ionicViewSwitcher.nextDirection("forward");
        }
        else {
          $ionicViewSwitcher.nextDirection("back");
        }
        $state.go('app.sell');
    };

    //Go to Offers tab. Ce code est commenté dans le fichier tabs.html
    this.selectMyOffer = function() {
        if ( $state.is('app.chatlist') === true ) {
          $ionicViewSwitcher.nextDirection("back");
        }
        else {
          $ionicViewSwitcher.nextDirection("forward");
        }
        $state.go('app.myoffers');
    };

    //Go to Messages tab. Ce code est commenté dans le fichier tabs.html
    this.selectChat = function() {
        $ionicViewSwitcher.nextDirection("forward");
        $state.go('app.chatlist');
    };

    //Show logout button in side menu if its not on the web.
    if( Meteor.isCordova ){
      self.isMobile = true;
    }
    else {
      self.isMobile = false;
      this.logout = function() {
        $rootScope.$broadcast('loadspinner');
        Meteor.logout(function(err) {
          if (!err) {
            if ( $state.is('app.shop') ){
              $ionicLoading.hide();
            } else {
              $state.go('app.shop');
            }
          }
          else {
            $ionicLoading.hide();

            $translate('MESSAGE.TOAST.TRY_AGAIN').then(function (message) {
              if (Meteor.isCordova) {
                $cordovaToast.showLongBottom(message);
              }
              else {
                toastr.error(message);
              }
            });
            return
          }
        });
      }
    }
};
