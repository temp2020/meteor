import { Meteor } from 'meteor/meteor';

angular
    .module('salephone')
    .controller('PacksCtrl', PacksCtrl);

 function PacksCtrl (
     $scope, 
     $reactive, 
     $state, 
     $ionicLoading, 
     $ionicHistory,
     $window,
     convertCurrency,
     $ionicPopup,
     $translate,
     $cordovaToast,
     $ionicLoading,
     $rootScope,
     $ionicPopover
    ) {
    $reactive(this).attach($scope);
    let self = this;

    this.tipName = '';

    this.baseCurrency = $window.localStorage.getItem('currencyBase') || 'EUR';

    this.myPack = {};

    this.packs = [];

    this.googlePlayError = false;

    this.subscribe('myPack', () => [], {
        onReady: function() {
          
            this.myPack = UserPack.findOne({ userId: Meteor.userId() });
            
            $translate(this.myPack.name).then(function (result) {
                self.tipName = result;
            });
            
            return;

        }
    });

    this.orderComplete = function(){

        $translate([
            'LABEL.BACK_HOME',
            'LABEL.ORDER_SUCCESS',
            'LABEL.PACK_APPLIED'
        ]).then(function (result) {

            self.successPopup = $ionicPopup.show({
                title: '<span class="balanced">' + result['LABEL.ORDER_SUCCESS'] + '</span>',
                template: result['LABEL.PACK_APPLIED'], 
                scope: $scope,
                buttons:[{
                    text: result['LABEL.BACK_HOME'],
                    type: 'button-balanced',
                    onTap: function(e) {
                        $state.go('app.shop');
                    }
                }]

            });
            
        })
    }

    this.clearOrder = function(){
        window.localStorage.removeItem('playProductType');
        window.localStorage.removeItem('playReceipt');
        window.localStorage.removeItem('playSignature');
        window.localStorage.removeItem('playPackName');
        window.localStorage.removeItem('playPayment');
        window.localStorage.removeItem('consumeError');
    }

    this.consumeExistingOrder = function(){
        
        let productType = window.localStorage.getItem('playProductType');
        let receipt = window.localStorage.getItem('playReceipt');
        let signature = window.localStorage.getItem('playSignature');
        let packName = window.localStorage.getItem('playPackName');
        let payment = JSON.parse( window.localStorage.getItem('playPayment') );

        if(!productType || !receipt || !signature){
            self.clearOrder();
            return;
        }

        inAppPurchase.consume(productType, receipt, signature)
            .then(function () {
                self.call('validateGooglePlay', receipt, signature, packName, payment, function(err){                    
                    if(!err){

                        self.clearOrder();
                        
                        self.orderComplete();
                    }
                    else {
                        console.log(err);

                        $translate('MESSAGE.TOAST.TRY_AGAIN')
                            .then(function (result) {
                                $cordovaToast.showShortBottom(result);
                            });
                    }
                });
        })
        .catch(function (err) {
            console.log(err.message);

            $translate('MESSAGE.TOAST.TRY_AGAIN')
                .then(function (result) {
                    $cordovaToast.showShortBottom(JSON.stringify(err));
                });

        });
    }

    this.loadGooglePlay =  function(productIds){
        if(!Meteor.isCordova){
            return
        }
                
        inAppPurchase
            .getProducts(productIds)
            .then(function (products) {
                             
                products.forEach( product => {

                    self.packs.map( pack => {
                                
                        if( product.productId === pack.googlePlayId ){
                                    
                            pack.price.amount = product.price.substr(1, product.price.length);
                                    
                            pack.price.currency = product.currency;

                        }

                        return pack;

                    });
                
                });
                
                if( self.googlePlayError === true ){
                    self.googlePlayError = false
                }

            })
            .catch(function (err) {

                self.googlePlayError = true;

                console.log( JSON.stringify(err, undefined, 2) );

            });
    }

    this.loadPacks = function(){

        this.call('getPacks', 'EUR', Meteor.isCordova, function(err, res){
            if(res){
                
                let hasOrder = window.localStorage.getItem('consumeError');

                if( hasOrder ){
                    self.consumeExistingOrder();
                }

                this.packs = res;
    
                if( Meteor.isCordova ){
    
                    let productIds = res
                        .filter( pack => { return pack.googlePlayId !== null })
                        .map( pack => { return pack.googlePlayId });
                    
                    if( productIds.length > 0 ){
                        self.loadGooglePlay(productIds);
                    }
    
                }
            }        
        });
    }

    this.loadPacks();

    if( window.localStorage.getItem('language') ){
        this.language = window.localStorage.getItem('language');
    }
    else {
        this.language = 'en';
    }
    
    this.priceAmount = function(price, currency){
        if(!price || !currency){
          return;
        }

        return convertCurrency(price, currency, this.baseCurrency);
    }  

    this.selectPack = function(index){
        
        if( self.packs[index].selected === true && self.packs[index].name !== self.myPack.name ){
            self.applyPack();
            return;
        }

        self.packs.forEach( (pack) => {
            return pack.selected = false;
         });
 
        self.packs[index].selected = true;
        
        $translate(self.packs[index].name).then(function (result) {
            self.tipName = result;
        });

    }

    this.androidOrder = function(productId, packName){

        let hasOrder = window.localStorage.getItem('consumeError');

        if( hasOrder ){
            self.consumeExistingOrder();
            return;
        }
        
        let selectedPack = this.packs.filter( pack => { return pack.googlePlayId === productId });
      
        let mode = Meteor.settings.public.googlePlay.mode;
  
        let payment = {
            amount: selectedPack[0].price.amount,
            currency: selectedPack[0].price.currency
        }
        
        self.orderPopup.close();

        inAppPurchase
            .buy(productId)
            .then(function (data) {

                inAppPurchase.consume(data.productType, data.receipt, data.signature)
                    .then(function () {
                        self.call('validateGooglePlay', data.receipt, data.signature, packName, payment, function(err){                    
                            $ionicLoading.hide();
                            if(!err){
                                self.orderComplete();
                            }
                            else {
                                console.log(err);
                                
                                $translate('MESSAGE.TOAST.TRY_AGAIN')
                                    .then(function (result) {
                                        $cordovaToast.showShortBottom(result);
                                    });
                            }
                        });
                    })
                    .catch(function (err) {
                        $ionicLoading.hide();

                        console.log(err.message);

                        window.localStorage.setItem('consumeError', '1');
                        window.localStorage.setItem('playReceipt', data.receipt);
                        window.localStorage.setItem('playSignature', data.signature);
                        window.localStorage.setItem('playProductType', data.productType);
                        window.localStorage.getItem('playPackName', packName);
                        window.localStorage.getItem('playPayment', JSON.stringify(payment));

                        $translate('MESSAGE.TOAST.TRY_AGAIN')
                            .then(function (result) {
                                $cordovaToast.showShortBottom(JSON.stringify(err));
                            });
        
                    });
            })
            .catch(function (err) {
                $ionicLoading.hide();

                console.log(err.message);

                $translate('MESSAGE.TOAST.TRY_AGAIN')
                    .then(function (result) {
                        $cordovaToast.showShortBottom(result);
                    });
            });

    }

    this.order = function(name, isFree, productId){
        if(!name){
            return;
        }
        
        $rootScope.$broadcast('loadspinner');

        if( name && productId && !isFree && Meteor.isCordova ){
            this.androidOrder(productId, name);
            return
        }

        $translate([
            'MESSAGE.TOAST.PACK_APPLIED',
            'MESSAGE.TOAST.TRY_AGAIN'
        ]).then(function (result) {

            self.orderPopup.close();

            self.call('valdiateFree', name, function(err){
                
                $ionicLoading.hide();
    
                if(err){
                    
                    if (Meteor.isCordova) {
                        $cordovaToast.showShortBottom(result['MESSAGE.TOAST.TRY_AGAIN']);
                    }
                    else {
                        toastr.error(result['MESSAGE.TOAST.TRY_AGAIN']);
                    }
    
                }
                else{
                    self.orderComplete();
                }
            });

        });
    }

    this.cancelOrder = function(){
        self.orderPopup.close();
    }

    this.applyPack = function(){
        let selected = this.packs.filter( pack => { return pack.selected });

        if( selected[0].name === self.myPack.name ){
            return;
        }

        if( 
            Meteor.isCordova && 
            selected[0].isFree === false && 
            selected[0].googlePlayId && 
            !selected[0].price.amount &&
            Meteor.settings.public.googlePlay.mode === 'live'
        ){
            if( self.googlePlayError ){
                self.loadPacks();
            }

            $translate('MESSAGE.TOAST.TRY_AGAIN')
                .then(function (result) {
                    $cordovaToast.showShortBottom(result);
                });
            
            return;
        }

        let buttonColor = 'button-calm';
        let buttonText = 'LABEL.ORDER_PAYPAL';
        let buttonIcon = 'fa-paypal';
        let isPaypal = true;

        if(Meteor.isCordova){
            buttonColor = 'button-balanced';
            buttonText = 'LABEL.ORDER_GOOGLE';
            buttonIcon = 'fa-android';
            isPaypal = false;
        }

        if( selected[0].isFree ){
            buttonColor = 'button-balanced';
            buttonText = 'LABEL.ORDER_FREE';
            buttonIcon = 'fa-check-circle-o';
            isPaypal = false;
        }

      $translate([
        selected[0].name,
        buttonText,
        'PACKS.FREE',
        'LABEL.CANCEL',
        'LABEL.ORDER_NOW',
        'MESSAGE.TOAST.PAYMENT_CANCEL',
        'MESSAGE.TOAST.TRY_AGAIN'
      ]).then(function (result) {

        let pricing = selected[0].price.currency + ' ' + selected[0].price.amount;

        if( selected[0].isFree ){
            pricing = result['PACKS.FREE'];
            isPaypal = false;
        }

        self.orderPopup = $ionicPopup.show({
            title: result['LABEL.ORDER_PACK'],
            template: `
                <div style="text-align: center;">
                    <p>
                        <span class="pack-title">
                            ${ result[selected[0].name] }
                        </span>
                    </p>
                    <img style="width: 40%;" src="${ selected[0].image }">
                    <br />
                    <p>
                        <span class="pack-price">
                            ${ pricing }
                        </span>
                    </p>
                </div>
                <div style="text-align: center">
                    <div ng-if="${ isPaypal }" id="paypal-button-container">
                    </div>
                    <button ng-hide="${ isPaypal }" ng-click="vm.order('${ selected[0].name }', ${ selected[0].isFree }, '${ selected[0].googlePlayId }')" class="button button-small button-block ${ buttonColor }">
                        <i class="fa ${ buttonIcon }" aria-hidden="true"></i>
                        ${ result[buttonText] }
                    </button>
                    <button ng-click="vm.cancelOrder()" class="button button-small button-block button-light">
                        Cancel
                    </button>
                </div>
            `,
            scope: $scope
          });

          if(isPaypal){
            setTimeout(function(){

                let message = {
                    error: result['MESSAGE.TOAST.TRY_AGAIN'],
                    cancel: result['MESSAGE.TOAST.PAYMENT_CANCEL'],
                    rejected: result['MESSAGE.TOAST.PAYMENT_REJECTED']
                }
  
                self.renderPayPal(selected[0], result[selected[0].name], message);

              }, 1);
          }

        });
    }

    this.validatePayPal = function(payment, packName){
        
        let userId = payment.transactions[0].custom;
        
        self.call('validatePayPal', payment.id, packName, userId, function(err){
            if(!err){
                
                return self.orderComplete();

            }
            else{

                $translate('MESSAGE.TOAST.TRY_AGAIN').then(function (result) {
                    toastr.error(result);
                });

                return;
            }
        });

    }

    this.renderPayPal = function(pack, name, message){
        if(!paypal){
            return;
        }

        const paypalSettings = Meteor.settings.public.paypal;

        let locales = supportedLocale();

        locales = locales.filter( locale => { return locale.language === this.language });

        paypal.Button.render({
            env: paypalSettings.mode, // sandbox or production
            style: {
                label: 'buynow',
                fundingicons: false, // optional
                branding: true, // optional
                size:  'responsive', // small | medium | large | responsive
                shape: 'rect',   // pill | rect
                color: 'blue',   // gold | blue | silve | black
                tagline: false
            },
            client: {
                sandbox: paypalSettings.sandbox,
                production: paypalSettings.production
            },
            locale: locales.length !== 0 ? locales[0].locale : 'en_US',
            payment: function(data, actions) {
                return actions.payment.create({
                    transactions: [
                        {
                            amount: { 
                                total: pack.price.amount, 
                                currency: pack.price.currency 
                            },
                            custom: Meteor.userId(),
                            item_list: {
                                items: [{
                                  name: 'Pack ' + name,
                                  quantity: '1',
                                  price: pack.price.amount,
                                  currency: pack.price.currency
                                }]
                            }
                        }
                    ]
                });
            },
            onAuthorize: function(data, actions) {
                actions.payment.execute().then(function(payment) {
                    
                    self.orderPopup.close();

                    if(payment.state === 'approved'){

                        return self.validatePayPal(payment, pack.name);

                    }
                    else{

                        return toastr.error(message.rejected);

                    }

                });
            },
            onCancel: function(data, actions){
                self.orderPopup.close();
                toastr.error(message.cancel);
                return;
            },
            onError: function(err){
                self.orderPopup.close();
                console.log(err);
                toastr.error(message.error);
                return;
            }   
        }, '#paypal-button-container');
    }


    /*
    $ionicPopover.fromTemplateUrl('client/templates/others/components/tooltip_star.html', {
        scope: $scope
    }).then(function(popover) {
        $scope.tipStar = popover;
    });
    */

    $ionicPopover.fromTemplateUrl('client/templates/others/components/tootip_packs.html', {
        scope: $scope
    }).then(function(popover) {
        $scope.tipOthers = popover;
    });

    this.showTip = function($event, pack){
        if(pack === 'star'){
            $scope.tipStar.show($event);
        }
        else{
            $scope.tipOthers.show($event);
        }
    }

    $scope.$on('$ionicView.beforeEnter', function () {
        if(!Meteor.isCordova && !document.getElementById('paypal') ){
            loadPayPal();
        }
    });

    $scope.$on('$ionicView.afterEnter', function () {
        $ionicLoading.hide();
        
    });

    $scope.$on('$ionicView.beforeLeave', function () {
        
        if( self.orderPopup ){
            self.orderPopup.close();
        }

        if( self.successPopup ){
            self.successPopup.close();
        }

        $ionicLoading.hide();

    });

    function loadPayPal() {

        let script = document.createElement("script");
        script.src = 'https://www.paypalobjects.com/api/checkout.js';
        script.id = 'paypal';

        document.head.appendChild(script);
    }

    function supportedLocale(){
        return [{
            language: 'en',
            locale: 'en_US'      
        },{
            langauge: 'de',
            locale: 'de_DE'
        },{
            language: 'fr',
            locale: 'fr_FR'
        }]

        // Supported Languages
        /*
        'en_US', 'en_AU', 'en_GB','fr_CA', 'es_ES', 'it_IT', 'fr_FR', 'de_DE', 'pt_BR', 'zh_CN', 
        'da_DK', 'zh_HK', 'id_ID', 'he_IL', 'ja_JP', 'ko_KR', 'nl_NL', 'no_NO', 'pl_PL', 'pt_PT', 
        'ru_RU', 'sv_SE', 'th_TH', 'zh_TW'
        */
    }
 };

