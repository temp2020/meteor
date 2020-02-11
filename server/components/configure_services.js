// Configure SendGrid API Key, for system email.
Meteor.startup(function () {

  if ( Meteor.settings.mailgun.username && Meteor.settings.mailgun.password ) {
    process.env.MAIL_URL = 'smtp://' +
      Meteor.settings.mailgun.username +
      ':' +
      Meteor.settings.mailgun.password +
      '@smtp.mailgun.org:587';
  }
  else if ( Meteor.settings.sendgrid.apiKey ) {
    process.env.MAIL_URL = 'smtp://apikey:' +
      Meteor.settings.sendgrid.apiKey +
      '@smtp.sendgrid.net:587';
  }
  else{
    if( Meteor.isDevelopment ){
      console.log('Automated Emails are not enabled. Please enter your API keys for emails.')
    }
  }

  if( Meteor.settings.paypal.sandbox && Meteor.settings.public.paypal.sandbox ){
    const paypal = require('paypal-rest-sdk');
    
    const paypalClient = Meteor.settings.public.paypal;
    const paypalServer = Meteor.settings.paypal;

    paypal.configure({
      mode: paypalServer.mode, //sandbox or live
      client_id: paypalClient[paypalClient.mode],
      client_secret: paypalServer[paypalServer.mode]
    });
    
    console.log('PayPal Configured')
  }

  if(Meteor.settings.googlePlay.publicKey){
    
    const iap = require('in-app-purchase');
        
    iap.config({ 
      test: Meteor.settings.googlePlay.mode !== 'live' ? true : false,
      googlePublicKeyStrSandBox: Meteor.settings.googlePlay.publicKey, 
      googlePublicKeyStrLive: Meteor.settings.googlePlay.publicKey
    });

    console.log('InApp Billing Configured');

  }

  //Configuration for Facebook Oauth.
  if( Meteor.settings.public.facebook.appId && Meteor.settings.facebook.secret ){
    ServiceConfiguration.configurations.upsert({service: 'facebook'}, {
      $set: {
        appId: Meteor.settings.public.facebook.appId,
        secret: Meteor.settings.facebook.secret,
        loginStyle: 'popup'
      }
    });
  }
  else{
    if( Meteor.isDevelopment ){
      console.log('Facebook login is not enabled. Please enter your API keys for FB Oauth.')
    }    
  }

  if( Meteor.settings.google.clientId && Meteor.settings.google.secret ){
    //Configuration for Google Oauth.
    ServiceConfiguration.configurations.upsert({service: 'google'}, {
      $set: {
        clientId: Meteor.settings.public.google.clientId,
        secret: Meteor.settings.google.secret,
        loginStyle: 'popup'
      }
    });
  }
  else{
    if( Meteor.isDevelopment ){
      console.log('Google login is not enabled. Please enter your API keys for Google Oauth.')
    }       
  }

});


