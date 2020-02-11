import { Meteor } from 'meteor/meteor';

Meteor.startup(function () {

  if( !Meteor.settings.fcm.serverKey || !Meteor.settings.public.fcm.senderId ){
	  if( Meteor.isDevelopment ){
      console.log('Push Notifications are not enabled. Please enter your API keys for Google FCM.')
    }
    return;
  }

  Push.Configure({
    gcm: {
      apiKey: Meteor.settings.fcm.serverKey,
      senderID: Meteor.settings.public.fcm.senderId
    },
    production: true,
    badge: true,
    sound: true,
    alert: true,
    vibrate: true,
    sendInterval: 3000,
    sendBatchSize: 1
  });
});

Meteor.methods({
  'sendNotification': function(user) {
    check(user, String);

    if( !Meteor.settings.fcm.serverKey || !Meteor.settings.public.fcm.senderId ){
      return;
    }

    let recepient = Meteor.users.findOne({ _id: user });

    let message = 'You have a new message.';

    if( recepient && recepient.profile.language === 'ar' ){
      message = '.لديك رسالة جديدة';
    }

    if( recepient && recepient.profile.language === 'fr' ){
      message = 'Vous avez un nouveau message.';
    }

    if( recepient && recepient.profile.language === 'es' ){
      message = 'Tienes un nuevo mensaje.';
    }

    if( recepient && recepient.profile.language === 'nl' ){
       message = 'U hebt een nieuw bericht.';
     }

     if( recepient && recepient.profile.language === 'it' ){
       message = 'Hai un nuovo messaggio.';
     }

     if( recepient && recepient.profile.language === 'de' ){
       message = 'Du hast eine neue Nachricht.';
     }

     if( recepient && recepient.profile.language === 'ru' ){
       message = 'У вас есть новое сообщение.';
     }

     if( recepient && recepient.profile.language === 'pt' ){
       message = 'Você tem uma nova mensagem.';
     }

     if( recepient && recepient.profile.language === 'jp' ){
       message = 'あなたは新しいメッセージを持っています。';
     }

     if( recepient && recepient.profile.language === 'zhs' ){
       message = '你有一个新的消息。';
     }

     if( recepient && recepient.profile.language === 'zht' ){
       message = '你有一個新的消息。';
     }

     if( recepient && recepient.profile.language === 'sw' ){
       message = 'Una ujumbe mpya.';
     }

     if( recepient && recepient.profile.language === 'hi' ){
       message = 'आपके पास एक नया संदेश है';
     }

    Push.send({
      from: 'Vastershops',
      title: 'Vastershops',
      text: message,
      badge: 1,
      query: {
        userId: user
      }
    });
  }
});
