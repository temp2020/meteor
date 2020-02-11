import { _meteorAngular } from 'meteor/angular';
import _ from 'underscore';

angular
    .module('salephone')
    .config(config)
    .run(loadspinner)
    .run(backConfirm);

function config($stateProvider, $urlRouterProvider, $ionicConfigProvider, $locationProvider) {
  //Remove text of Header back button.
  $ionicConfigProvider.backButton.previousTitleText(false).text('');
  $locationProvider.html5Mode(true);
  
  $stateProvider

  .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'client/templates/main/menu.html',
    controller: 'MenuCtrl as menu' //client/templates/main/menu.js
  })
  .state('app.stores', {
    cache: false,
    url: '/stores',
    views: {
      'menuContent@app': {
        templateUrl: 'client/templates/shop/stores.html',
        controller: 'StoresCtrl as vm', //client/templates/shop/shop.js
      }
    }
  })

  .state('app.store', {
    cache: false,
    url: '/stores/:storeId',
    views: {
      'menuContent@app': {
        templateUrl: 'client/templates/store/store.html',
        controller: 'StoreCtrl as vm' 
      }
    }
  })

  .state('app.shop', {
    cache: false,
    url: '/shop',
    views: {
      'menuContent@app': {
        templateUrl: 'client/templates/shop/shop.html',
        controller: 'ShopCtrl as vm', //client/templates/shop/shop.js
      }
    }
  })

  .state('app.verify', {
    url: '/shop/verify/:token',
    views: {
      'menuContent@app': {
        templateUrl: 'client/templates/shop/shop.html',
        controller: 'ShopCtrl as vm', //client/templates/shop/shop.js
      }
    }
  })

  .state('app.listings', {
    cache: false,
    url: '/listings/:type/:groupId',
    views: {
      'menuContent@app': {
        templateUrl: 'client/templates/shop/listings_index.html',
        controller: 'ListingsCtrl as vm' //client/templates/shop/listings_index.js
      }
    }
  })

  .state('app.product', {
    cache: false,
    url: '/shop/products/:listingId',
    views: {
      'menuContent@app': {
        templateUrl: 'client/templates/product_page/product_buyer.html',
        controller: 'BuyerCtrl as vm' //client/templates/product_page/product_buyer.js
      }
    }
  })

  .state('app.seller', {
    url: '/shop/seller/:profileId',
    views: {
      'menuContent@app': {
        templateUrl: 'client/templates/users/user_profile.html',
        controller: 'ProfCtrl as vm' //client/templates/users/user_profile.js
      }
    }
  })

  .state('app.myproduct', {
    cache: false,
    url: '/sell/products/:listingId?viewoffer',
    views: {
      'menuContent@app': {
        resolve: {
          user: isAuthorized,
        },
        templateUrl: 'client/templates/product_page/product_seller.html',
        controller: 'SellerCtrl as vm', //client/templates/product_page/product_seller.js
        params: {
          viewoffer: null
        }
      }
    }
  })

  .state('app.sell', {
    cache: false,
    url: '/sell',
    views: {
      'menuContent@app': {
        templateUrl: 'client/templates/sell/sell.html',
        controller: 'SellCtrl as vm' //client/templates/sell/sell.js
      }
    }
  })

  .state('app.select', {
    cache: false,
    url: '/sell/new_post',
    views: {
      'menuContent@app': {
        templateUrl: 'client/templates/sell/select.html',
        controller: 'SelectCtrl as vm', //client/templates/sell/select.js
        resolve: {
          user: isAuthorized,
        }
      }
    }
  })

  .state('app.new-post-images', {
    cache: false,
    url: '/sell/new/images',
    views: {
      'menuContent@app': {
        templateUrl: 'client/templates/sell/new_listing/images.html',
        controller: 'NewPostImagesCtrl as vm', 
        resolve: {
          user: isAuthorized
        }
      }
    }
  })

  .state('app.new-post-category', {
    cache: false,
    url: '/sell/new/categories',
    views: {
      'menuContent@app': {
        templateUrl: 'client/templates/sell/new_listing/categories.html',
        controller: 'NewPostCategoriesCtrl as vm', 
        resolve: {
          user: isAuthorized
        }
      }
    }
  })
  
  .state('app.new-post-title', {
    cache: false,
    url: '/sell/new/title',
    views: {
      'menuContent@app': {
        templateUrl: 'client/templates/sell/new_listing/title.html',
        controller: 'NewPostTitleCtrl as vm', 
        resolve: {
          user: isAuthorized
        }
      }
    }
  })

  .state('app.new-post-condition', {
    cache: false,
    url: '/sell/new/condition',
    views: {
      'menuContent@app': {
        templateUrl: 'client/templates/sell/new_listing/condition.html',
        controller: 'NewPostConditionCtrl as vm', 
        resolve: {
          user: isAuthorized
        }
      }
    }
  })

  .state('app.new-post-condition-type', {
    cache: false,
    url: '/sell/new/condition-type',
    views: {
      'menuContent@app': {
        templateUrl: 'client/templates/sell/new_listing/condition_type.html',
        controller: 'NewPostConditionTypeCtrl as vm', 
        resolve: {
          user: isAuthorized
        }
      }
    }
  })

  .state('app.new-post-price', {
    cache: false,
    url: '/sell/new/price',
    views: {
      'menuContent@app': {
        templateUrl: 'client/templates/sell/new_listing/price.html',
        controller: 'NewPostPriceCtrl as vm', 
        resolve: {
          user: isAuthorized
        }
      }
    }
  })

  .state('app.new-post-my-location', {
    cache: false,
    url: '/sell/new/my-location',
    views: {
      'menuContent@app': {
        templateUrl: 'client/templates/sell/new_listing/my_location.html',
        controller: 'NewPostMyLocationCtrl as vm', 
        resolve: {
          user: isAuthorized
        }
      }
    }
  })

  .state('app.new-post-description', {
    cache: false,
    url: '/sell/new/description',
    views: {
      'menuContent@app': {
        templateUrl: 'client/templates/sell/new_listing/description.html',
        controller: 'NewPostDescriptionCtrl as vm',
        resolve: {
          user: isAuthorized
        }
      }
    }
  })

  .state('app.new-post-details', {
    cache: false,
    url: '/sell/new/details',
    views: {
      'menuContent@app': {
        templateUrl: 'client/templates/sell/new_listing/details.html',
        controller: 'NewPostDetailsCtrl as vm',
        resolve: {
          user: isAuthorized
        }
      }
    }
  })

  .state('app.new-post-meet-location', {
    cache: false,
    url: '/sell/new/meet-location',
    views: {
      'menuContent@app': {
        templateUrl: 'client/templates/sell/new_listing/meet_location.html',
        controller: 'NewPostMeetLocationCtrl as vm', 
        resolve: {
          user: isAuthorized
        }
      }
    }
  })

  /*
  .state('app.newpost', {
    cache: false,
    url: '/sell/new/:productId',
    views: {
      'menuContent@app': {
        templateUrl: 'client/templates/sell/new_listing.html',
        controller: 'PostCtrl as vm', //client/templates/sell/new_listing.js
        resolve: {
          user: isAuthorized
        }
      }
    }
  })
  */

  .state('app.editpost', {
    cache: false,
    url: '/sell/edit/:listingId',
    views: {
      'menuContent@app': {
        resolve: {
          user: isAuthorized,
        },
        templateUrl: 'client/templates/sell/edit_listing.html',
        controller: 'EditCtrl as vm' //client/templates/sell/edit_listing.js
      }
    }
  })

  .state('app.myoffers', {
    url: '/my-offers',
    cache: false,
    views: {
      'menuContent@app': {
        resolve: {
          user: isAuthorized
        },
        templateUrl: 'client/templates/sell/offers_received.html',
        controller: 'OffersRcvdCtrl as vm'
      }
    }
  })

  .state('app.offerSent', {
    url: '/offers-sent',
    cache: false,
    views: {
      'menuContent@app': {
        resolve: {
          user: isAuthorized
        },
        templateUrl: 'client/templates/shop/my_offers.html',
        controller: 'MyOfferCtrl as vm'
      }
    }
  })

  .state('app.favorites', {
    url: '/favorite-stores',
    cache: false,
    views: {
      'menuContent@app': {
        resolve: {
          user: isAuthorized
        },
        templateUrl: 'client/templates/others/favorite_stores.html',
        controller: 'FavoritesCtrl as vm'
      }
    }
  })

  .state('app.followed', {
    cache: false,
    url: '/followed-listings',
    views: {
      'menuContent@app': {
        resolve: {
          user: isAuthorized
        },
        templateUrl: 'client/templates/others/followed.html',
        controller: 'FollowedCtrl as vm' //client/templates/shop/listings_index.js
      }
    }
  })  

  .state('app.chatlist', {
    url: '/conversations',
    views: {
      'menuContent@app': {
        resolve: {
          user: isAuthorized
        },
        templateUrl: 'client/templates/messages/chat_list.html',
        controller: 'ChatCtrl as vm' //client/templates/messages/chat_list.js
      }
    }
  })

  .state('app.chat', {
    cache: false,
    url: '/chat/:chatId',
    views: {
      'menuContent@app': {
        resolve: {
          user: isAuthorized
        },
        templateUrl: 'client/templates/messages/chat.html',
        controller: 'MsgCtrl as vm' //client/templates/messages/chat.js
      }
    }
  })

  .state('app.chatinfo', {
    url: '/chat_info/:chatId',
    views: {
      'menuContent@app': {
        resolve: {
          user: isAuthorized
        },
        templateUrl: 'client/templates/messages/chat_details.html',
        controller: 'MsgInfoCtrl as vm' //client/templates/messages/chat_details.js
      }
    }
  })

  .state('app.feeds', {
    url: '/activities',
    views: {
      'menuContent@app': {
        resolve: {
          user: isAuthorized,
          subscribe: function() {
            return Meteor.subscribe('myProfile');
          }
        },
        templateUrl: 'client/templates/main/activity_feed.html',
        controller: 'FeedsCtrl as vm' //client/templates/main/activity_feed.js
      }
    }
  })

  .state('app.search', {
    url: '/search',
    views: {
      'menuContent@app': {
        templateUrl: 'client/templates/others/search.html',
        controller: 'SearchCtrl as vm' //client/templates/main/search.js
      }
    }
  })

  .state('app.myprofile', {
    url: '/myprofile/',
    views: {
      'menuContent@app': {
        resolve: {
          user: isAuthorized,
        },
        templateUrl: 'client/templates/users/my_profile.html',
        controller: 'myProfCtrl as vm'  //client/templates/users/my_profile.js
      }
    }
  })

  .state('app.editprofile', {
    cache: false,
    url: '/myprofile/edit/',
    views: {
      'menuContent@app': {
        resolve: {
          user: isAuthorized
        },
        templateUrl: 'client/templates/users/edit_profile.html',
        controller: 'EditProfCtrl as vm'  //client/templates/users/edit_profile.js
      }
    }
  })

  .state('app.about', {
    cache: false,
    url: '/about',
    views: {
      'menuContent@app': {
        templateUrl: 'client/templates/others/about.html',
        controller: 'AboutCtrl as vm'
      }
    }
  })

  .state('app.login', {
    cache: false,
    url: '/login',
    views: {
      'menuContent@app': {
        templateUrl: 'client/templates/users/auth/login.html',
        controller: 'LoginCtrl as vm' //client/templates/users/auth/login.js
      }
    }
  })

  .state('app.register', {
    cache: false,
    url: '/register',
    views: {
      'menuContent@app': {
        templateUrl: 'client/templates/users/auth/register.html',
        controller: 'RegCtrl as vm' //client/templates/users/auth/register.js
      }
    }
  })

  .state('app.forgot', {
    cache: false,
    url: '/reset',
    views: {
      'menuContent@app': {
        templateUrl: 'client/templates/users/auth/forgot_pwd.html',
        controller: 'ForgotPwdCtrl as vm' //client/templates/users/auth/forgot_pwd.js
      }
    }
  })

  .state('app.reset', {
    cache: false,
    url: '/reset/:token',
    views: {
      'menuContent@app': {
        templateUrl: 'client/templates/users/auth/reset_pwd.html',
        controller: 'ForgotPwdCtrl as vm' //client/templates/users/auth/reset_pwd.js
      }
    }
  })

  .state('app.account', {
    cache: false,
    url: '/edit/account',
    views: {
      'menuContent@app': {
        templateUrl: 'client/templates/users/auth/change_pwd.html',
        controller: 'AuthCtrl as vm', //client/templates/users/auth/change_pwd.js
        resolve: {
          user: isAuthorized
        }
      }
    }
  })

  .state('app.packs', {
    cache: false,
    url: '/packs',
    views: {
      'menuContent@app': {
        templateUrl: 'client/templates/cards/packs.html',
        controller: 'PacksCtrl as vm' //client/templates/others/packs.js
      }
    }
  })

  .state('app.pubCards', {
    cache: false,
    url: '/cards',
    views: {
      'menuContent@app': {
        templateUrl: 'client/templates/cards/pub_cards.html',
        controller: 'PubCardsCtrl as vm' //client/templates/others/cards.js
      }
    }
  })

  .state('app.dealyDeals', {
    cache: false,
    url: '/daily-deals',
    views: {
      'menuContent@app': {
        templateUrl: 'client/templates/cards/daily_deals.html',
        controller: 'DailyDealsCtrl as vm' 
      }
    }
  })

  .state('app.searchCards', {
    cache: false,
    url: '/search-cards',
    views: {
      'menuContent@app': {
        templateUrl: 'client/templates/cards/search_cards.html',
        controller: 'SearchCardsCtrl as vm',
        resolve: {
          user: isAuthorized
        }
      }
    }
  })

  .state('app.dayCards', {
    cache: false,
    url: '/day-cards',
    views: {
      'menuContent@app': {
        templateUrl: 'client/templates/cards/day_cards.html',
        controller: 'DayCardsCtrl as vm' 
      }
    }
  })

  .state('app.radiusCards', {
    cache: false,
    url: '/radius-cards',
    views: {
      'menuContent@app': {
        templateUrl: 'client/templates/cards/radius_cards.html',
        controller: 'RadiusCardsCtrl as vm' 
      }
    }
  })

  .state('app.help', {
    cache: false,
    url: '/help',
    views: {
      'menuContent@app': {
        templateUrl: 'client/templates/others/help.html',
        controller: 'HelpCtrl as vm' 
      }
    }
  })

  .state('app.myStore', {
    cache: false,
    url: '/my-store',
    views: {
      'menuContent@app': {
        templateUrl: 'client/templates/store/my_store.html',
        controller: 'MyStoreCtrl as vm' 
      }
    }
  })

  .state('app.storeSettings', {
    cache: false,
    url: '/my-store/settings',
    views: {
      'menuContent@app': {
        templateUrl: 'client/templates/store/store_settings.html',
        controller: 'StoreSettingsCtrl as vm' 
      }
    }
  })

  $urlRouterProvider.otherwise('/app/shop');

  //Require user to login before going to page, or redirect to Login page.
  function isAuthorized($state, $ionicViewSwitcher, $q) {
    let deferred = $q.defer();

    if (_.isEmpty(Meteor.user())) {
      deferred.reject('AUTH_REQUIRED');
      $ionicViewSwitcher.nextDirection("back");
      $state.go('app.login');
    }
    else {
      deferred.resolve();
    }
    return deferred.promise;
  }
};

//Loading spinner function.
function loadspinner($rootScope, $ionicLoading) {
    $rootScope.$on('loadspinner', function() {
        $ionicLoading.show({
            template: '<ion-spinner class="spinner-light" icon="spiral"></ion-spinner>',
            noBackdrop: true
        })
    });
    /*
    $rootScope.$on('$viewContentLoading', function(event){
        $rootScope.$broadcast('loadspinner');
    });
    */
};

function backConfirm($ionicPlatform, $ionicHistory, $state) {
  $ionicPlatform.registerBackButtonAction(function(event) {
    if ( true && $ionicHistory.backView() ) {
      $ionicHistory.goBack();
    }
    else if( true && !$ionicHistory.backView() && $state.is('app.shop') ) {
      ionic.Platform.exitApp(); 
    }
    else if( true && !$ionicHistory.backView() && !$state.is('app.shop') ) {
      $state.go('app.shop');
    }
  }, 100);
};
