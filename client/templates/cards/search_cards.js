angular
  .module('salephone')
  .controller('SearchCardsCtrl', SearchCardsCtrl);

function SearchCardsCtrl (
  $scope, 
  $reactive,
  $ionicPopover,
  $state,
  $ionicLoading,
  $translate,
  $ionicPopup,
  $timeout,
  $document
) {
  $reactive(this).attach($scope);
  const self = this;

  this.tooltipText = 'CARDS.SEARCH_TOOLTIP'
  
  this.coins = { quantity: 0 };
  this.cards = [];
  this.popup;
  this.popupEl;
  this.myPack;

  this.isExpired = function(expiry) {
    return expiry !== null && new Date() >= expiry
  }

  this.isSelected = function(selectedCard, cardName) {
    return selectedCard 
      && !self.isExpired(selectedCard.expiry)
      && selectedCard.selected === cardName;
  }

  this.subscribe('searchCardsPage', () => [], {
    onReady: () => {

      self.call('updateExpiredSearchCard');
      
      const userId = Meteor.userId();
      
      const userCard = UserSearchCards.findOne({ userId });

      const selected = self.isExpired(userCard.expiry)
        ? null
        : userCard.selected;

      self.cards = SearchCards.find().fetch().map(card => {
        card.selected = selected === card.name ? true : false;
        card.image = `images/search-cards/${card.name}.png`;
        return card;
      });

      self.myPack = UserPack.findOne({ userId: userId });
    } 
  });

  this.helpers({
    coins: () => Coins.findOne({ userId: Meteor.userId() }),
    selectedCard: () => UserSearchCards.findOne({ userId: Meteor.userId() })
  });

  $ionicPopover.fromTemplateUrl('client/templates/others/components/tooltip_cards.html', {
    scope: $scope
  }).then(function(popover) {
    $scope.tooltip = popover;
  });

  this.showTip = function($event){
    $scope.tooltip.show($event);
  }

  this.purchaseCard = function(cardId) {
    $translate([
      'MESSAGE.TOAST.TRY_AGAIN',
      'MESSAGE.TOAST.SEARCH_CARD_SELECTED'
    ])
    .then(function(text) {
      
      self.call('selectSearchCard', cardId, function(err) {
        let message = text['MESSAGE.TOAST.SEARCH_CARD_SELECTED']

        if(err) {
          
          message = text['MESSAGE.TOAST.TRY_AGAIN'];

          if (Meteor.isCordova) {
            $cordovaToast.showShortBottom(message);
          }
          else {
            toastr.error(message);
          }
          return;
        }

        if (Meteor.isCordova) {
          $cordovaToast.showShortBottom(message);
        }
        else {
          toastr.success(message);
        }
      });

    });

  }

  this.selectCard = function(index) {

    if (self.selectedCard.name === self.cards[index].name) {
      return;
    }

    $translate([
      'LABEL.PURCHASE',
      'LABEL.FREE',
      'MESSAGE.TOAST.INSUFFICIENT_COINS'
    ])
    .then(function(text) {

      const isFree = self.cards[index].cost === 0 
        || self.cards[index].freePack === self.myPack.name
        ? true
        : false;

      const amount = self.cards[index].cost
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      
      const subtitle = isFree
        ? text['LABEL.FREE']
        : `${ amount } vscoins`
      
      self.popup = $ionicPopup.show({
        title: self.cards[index].name,
        cssClass: 'search-card',
        subTitle: subtitle,
        buttons: [{ 
          text: text['LABEL.PURCHASE'], 
          type: 'button-balanced search-card',
          onTap: function(e) {

            if (!isFree && self.coins.quantity < self.cards[index].cost) {
              
              e.preventDefault();
              
              const message = text['MESSAGE.TOAST.INSUFFICIENT_COINS'];

              if (Meteor.isCordova) {
                $cordovaToast.showShortBottom(message);
              }
              else {
                toastr.error(message);
              }

              return;
            }

            self.purchaseCard(self.cards[index]._id);

          } 
        }]
      });

      $timeout(function() {
        
        $document.on('click', function(e){
          
          const { className } = e.target;

          if ( 
            !className || 
              ( !className.includes('popup') && !className.includes('button-balanced search-card') )
          ) {
            self.popup.close();
          }
        });

        self.popup.then(() => $document.off('click'));
      }, 300);

    });
  }

  $scope.$on('$ionicView.afterEnter', function () {
    $ionicLoading.hide();
  });

};