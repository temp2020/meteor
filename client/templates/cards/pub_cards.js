
angular
    .module('salephone')
    .controller('PubCardsCtrl', PubCardsCtrl);

 function PubCardsCtrl (
     $scope, 
     $reactive,
     $ionicPopover,
     $state
    ) {
    $reactive(this).attach($scope);
    let self = this;

    this.tooltipText = 'CARDS.PUB_TOOLTIP'

    this.coins = {
        quantity: 0
    };

    this.cards = [
      { image: 'images/cards/card-1.png', level: 1, unlocked: false },
      { image: 'images/cards/card-2.png', level: 2, unlocked: false },
      { image: 'images/cards/card-3.png', level: 3, unlocked: false },
      { image: 'images/cards/card-5.png', level: 4, unlocked: false },
      { image: 'images/cards/card-8.png', level: 5, unlocked: false },
      { image: 'images/cards/card-13.png', level: 6, unlocked: false }
    ];

    this.call('updateCardLevel');

    this.subscribe('myCardsPage', () => [], {
        onReady: () => { return; } 
    });

    this.helpers({
      coins: () => Coins.findOne({ userId: Meteor.userId() }),
      myCards: () => UserCards.findOne({ userId: Meteor.userId() })
    });

    this.autorun(() => {
        if( self.getCollectionReactively('myCards') ){

            self.cards.map(card => {
              return card.unlocked = self.myCards.level >= card.level ? true : false;
            });

        }
      });

    this.new = function(){

        if( !Meteor.userId() ){
          $state.go('app.login');
          return;
        }
  
        self.call('checkListingCount', function(err, res){
          if( res === true ){
            $state.go('app.sell');
            return;
          }
          else{
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
            }
            else{
  
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
    }
  
    $ionicPopover.fromTemplateUrl('client/templates/others/components/tooltip_cards.html', {
        scope: $scope
    }).then(function(popover) {
        $scope.tooltip = popover;
    });

    this.showTip = function($event, pack){
        $scope.tooltip.show($event);
    }

 };

