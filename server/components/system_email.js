import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

Accounts.emailTemplates.siteName = "Vastershops";
Accounts.emailTemplates.from = "Vastershops <noreply@vastershops.com>";

//System email templates for Verify Account and Reset Password.

Accounts.emailTemplates.verifyEmail.subject = function (user) {
  let en = "Verify your account.";
  let ar = "تحقق من حسابك";
  let fr = "Vérifier votre compte.";
  let es = "Revise su cuenta.";
  let nl = "Verifieer uw account.";
  let it = "Controlla il tuo account.";
  let de = "Überprüfen Sie Ihr Konto.";
  let ru = "Проверьте свою учетную запись.";
  let pt = "Verifique sua conta.";
  let jp = "あなたのアカウントを確認してください。";
  let zhs = "请检查您的帐户。";
  let zht = "請檢查您的帳戶。";
  let sw = "Hakikisha akaunti yako.";
  let hi = "अपने खाते को सत्यापित करें।";

  if( user.profile.language === 'hi' ){
    return hi;
  }
  if( user.profile.language === 'sw' ){
    return sw;
  }
  if( user.profile.language === 'zht' ){
    return zht;
  }
  if( user.profile.language === 'zhs' ){
    return zhs;
  }
  if( user.profile.language === 'jp' ){
    return jp;
  }
  if( user.profile.language === 'pt' ){
    return pt;
  }
  if( user.profile.language === 'ru' ){
    return ru;
  }
  if( user.profile.language === 'de' ){
    return de;
  }
  if( user.profile.language === 'it' ){
    return it;
  }
  if( user.profile.language === 'nl' ){
   return nl;
  }
  if( user.profile.language === 'es' ){
    return es;
  }
  if( user.profile.language === 'fr' ){
    return fr;
  }
  if( user.profile.language === 'ar' ){
    return ar;
  }
  return en;
};

Accounts.emailTemplates.verifyEmail.text = function (user, url) {
    let en = "Hi " + user.username + ",\n\n\n"
      + "Thank you for joining. Please click on the link below to verify your account:\n\n"
      + url
      + "\n\n\n\n\n\n"
      + "Vastershops welcome you warmly to your new business rig";

    let ar = user.username + " مرحبا" + "\n\n\n"
      + ":شكرا لانضمامك. يرجى النقر على الرابط أدناه للتحقق من حسابك\n\n"
      + url
      + "\n\n\n\n\n\n"
      + "Vastershops";

    let fr = "Bonjour " + user.username + ",\n\n\n"
      + "Merci pour l'inscription. Veuillez cliquer sur le lien suivant pour vérifier votre compte:\n\n"
      + url
      + "\n\n\n\n\n\n"
      + "Vastershops vous souhaite la bienvenue dans votre nouvelle plate-forme de commerce.";

    let es = "Hola " + user.username + ",\n\n\n"
      + "Gracias por inscribirse. Haga clic en el siguiente enlace para verificar su cuenta:\n\n"
      + url
      + "\n\n\n\n\n\n"
      + "Vastershops le dan la bienvenida a su nueva plataforma de negocios.";

    let nl = "Hallo " + user.username + ",\n\n\n"
      + "Bedankt voor uw deelname. Klik op de onderstaande link om uw account te verifiëren:\n\n"
      + url
      + "\n\n\n\n\n\n"
      + "Vastershops heten u van harte welkom op uw nieuwe bedrijf.";

    let it = "Buongiorno " + user.username + ",\n\n\n"
      + "Grazie per la registrazione. Fai clic sul seguente link per verificare il tuo account:\n\n"
      + url
      + "\n\n\n\n\n\n"
      + "Vastershops vi danno il benvenuto nella vostra nuova attività.";

    let de = "Hallo " + user.username + ",\n\n\n"
      + "Danke, dass Du mitmachst. Bitte klicken Sie auf den folgenden Link, um Ihr Konto zu bestätigen:\n\n"
      + url
      + "\n\n\n\n\n\n"
      + "Vastershops begrüßen Sie herzlich zu Ihrem neuen Business-Rig.";

    let ru = "привет " + user.username + ",\n\n\n"
      + "Спасибо за участие. Чтобы подтвердить свою учетную запись, нажмите следующую ссылку:\n\n"
      + url
      + "\n\n\n\n\n\n"
      + "Vastershops приветствуют вас тепло на новой бизнес-платформе";

    let pt = "Olá " + user.username + ",\n\n\n"
      + "Obrigado por se inscrever. Clique no seguinte link para verificar sua conta:\n\n"
      + url
      + "\n\n\n\n\n\n"
      + "Vastershops dá-lhe as boas-vindas à sua nova plataforma de negócios.";

    let jp = "こんにちは " + user.username + ",\n\n\n"
      + "参加していただきありがとうございます。 あなたのアカウントを確認するには、下のリンクをクリックしてください：\n\n"
      + url
      + "\n\n\n\n\n\n"
      + "Vastershopsは新しいビジネスリグに熱心に歓迎します";

    let zhs = "您好 " + user.username + ",\n\n\n"
      + "感谢您的参与。 要查看您的帐户，请点击以下链接：\n\n"
      + url
      + "\n\n\n\n\n\n"
      + "Vastershops热烈欢迎新的商业钻机";

    let zht = "您好 " + user.username + ",\n\n\n"
      + "感謝您的參與。 要查看您的帳戶，請點擊以下鏈接：\n\n"
      + url
      + "\n\n\n\n\n\n"
      + "Vastershops熱烈歡迎新的商業鑽機";

    let sw = "Hujambo " + user.username + ",\n\n\n"
      + "Asante kwa kujiunga. Tafadhali bofya kiungo chini ili kuthibitisha akaunti yako:\n\n"
      + url
      + "\n\n\n\n\n\n"
      + "Vastershops kukukubali kwa joto kwa biashara yako mpya ya rig";

    let hi = "नमस्ते " + user.username + ",\n\n\n"
      + "शामिल होने के लिए धन्यवाद। अपना खाता सत्यापित करने के लिए कृपया नीचे दिए गए लिंक पर क्लिक करें:\n\n"
      + url
      + "\n\n\n\n\n\n"
      + "सूक आपके नए व्यापारिक रिग के लिए आपका स्वागत करता है।";

      if( user.profile.language === 'hi' ){
          return hi;
    }

            if( user.profile.language === 'sw' ){
          return sw;
    }

      if( user.profile.language === 'zht' ){
          return zht;
   }

      if( user.profile.language === 'zhs' ){
       return zhs;
   }

      if( user.profile.language === 'jp' ){
    return jp;
   }

      if( user.profile.language === 'pt' ){
        return pt;
   }

      if( user.profile.language === 'ru' ){
        return ru;
   }

      if( user.profile.language === 'de' ){
         return de;
   }

      if( user.profile.language === 'it' ){
       return it;
   }

      if( user.profile.language === 'nl' ){
     return nl;
   }

      if( user.profile.language === 'es' ){
    return es;
   }

      if( user.profile.language === 'fr' ){
    return fr;
   }

      if( user.profile.language === 'ar' ){
    return ar;
   }

  return en;
};

Accounts.emailTemplates.resetPassword.subject = function (user) {
  let en = "Forgot password?";
  let ar = "هل نسيت كلمة المرور؟";
  let fr = "Mot de passe oublié?";
  let es = "¿Contraseña olvidada?";
  let nl = "Wachtwoord vergeten?";
  let it = "Hai dimenticato la tua password?";
  let de = "Passwort vergessen?";
  let ru = "Забыли пароль?";
  let pt = "Esqueceu a senha?";
  let jp = "パスワードをお忘れですか？";
  let zhs = "忘记密码？";
  let zht = "忘記密碼？";
  let sw = "Umesahau nywila?";
  let hi = "पासवर्ड भूल गए?";

     if( user.profile.language === 'hi' ){
  return hi;
  }

     if( user.profile.language === 'sw' ){
  return sw;
  }

     if( user.profile.language === 'zht' ){
return zht;
}

     if( user.profile.language === 'zhs' ){
return zhs;
}

     if( user.profile.language === 'jp' ){
    return jp;
  }

    if( user.profile.language === 'pt' ){
    return pt;
  }

    if( user.profile.language === 'ru' ){
    return ru;
  }

      if( user.profile.language === 'de' ){
    return de;
  }

      if( user.profile.language === 'it' ){
    return it;
  }

      if( user.profile.language === 'nl' ){
    return nl;
  }

      if( user.profile.language === 'es' ){
    return es;
  }

      if( user.profile.language === 'fr' ){
    return fr;
  }

      if( user.profile.language === 'ar' ){
    return ar;
  }

    return en;
};

Accounts.emailTemplates.resetPassword.text = function (user, url) {
  let en = "Hi " + user.username + ",\n\n\n"
    + "Please click on the link below to reset your password:\n\n"
    + url
    + "\n\n\n\n\n\n"
    + "Vastershops";

  let ar = user.username + " مرحبا" + "\n\n\n"
    + "يرجى النقر على الرابط أدناه لإعادة تعيين كلمة المرور:"
    + url
    + "\n\n\n\n\n\n"
    + "Vastershops";

  let fr = "Bonjour " + user.username + ",\n\n\n"
    + "Veuillez cliquer sur le lien suivant pour réinitialiser votre mot de passe:\n\n"
    + url
    + "\n\n\n\n\n\n"
    + "Vastershops";

  let es = "Hola " + user.username + ",\n\n\n"
    + "Haga clic en el siguiente enlace para restablecer su contraseña:\n\n"
    + url
    + "\n\n\n\n\n\n"
    + "Vastershops";

  let nl = "Hi " + user.username + ",\n\n\n"
    + "Klik op de onderstaande link om uw wachtwoord opnieuw in te stellen:\n\n"
    + url
    + "\n\n\n\n\n\n"
    + "Vastershops";

  let it = "Buongiorno " + user.username + ",\n\n\n"
    + "Fai clic sul seguente collegamento per reimpostare la tua password:\n\n"
    + url
    + "\n\n\n\n\n\n"
    + "Vastershops";

  let de = "Hallo " + user.username + ",\n\n\n"
      + "Bitte klicken Sie auf den folgenden Link, um Ihr Passwort zurückzusetzen:\n\n"
      + url
      + "\n\n\n\n\n\n"
      + "Vastershops";

  let ru = "привет " + user.username + ",\n\n\n"
      + "Для сброса пароля нажмите на следующую ссылку:\n\n"
      + url
      + "\n\n\n\n\n\n"
      + "Vastershops";

  let pt = "Olá " + user.username + ",\n\n\n"
      + "Por favor, clique no link abaixo para redefinir sua senha:\n\n"
      + url
      + "\n\n\n\n\n\n"
      + "Vastershops";

  let jp = "こんにちは " + user.username + ",\n\n\n"
      + "パスワードをリセットするには、下のリンクをクリックしてください:\n\n"
      + url
      + "\n\n\n\n\n\n"
      + "Vastershops";

  let zhs = "您好 " + user.username + ",\n\n\n"
      + "要重置密码，请点击以下链接：\n\n"
      + url
      + "\n\n\n\n\n\n"
      + "Vastershops";

  let zht = "您好 " + user.username + ",\n\n\n"
      + "要重置密碼，請點擊以下鏈接：\n\n"
      + url
      + "\n\n\n\n\n\n"
      + "Vastershops";

  let sw = "Hujambo " + user.username + ",\n\n\n"
      + "Tafadhali bonyeza kwenye kiungo hapa chini ili upya upya nenosiri lako:\n\n"
      + url
      + "\n\n\n\n\n\n"
      + "Vastershops";

  let hi = "नमस्ते " + user.username + ",\n\n\n"
      + "कृपया अपना पासवर्ड रीसेट करने के लिए नीचे दिए गए लिंक पर क्लिक करें:\n\n"
      + url
      + "\n\n\n\n\n\n"
      + "Vastershops";

      if( user.profile.language === 'hi' ){
              return hi;
      }

      if( user.profile.language === 'sw' ){
              return sw;
      }

      if( user.profile.language === 'zht' ){
              return zht;
      }

      if( user.profile.language === 'zhs' ){
              return zhs;
      }

      if( user.profile.language === 'jp' ){
              return jp;
    }

      if( user.profile.language === 'pt' ){
              return pt;
    }

      if( user.profile.language === 'ru' ){
              return ru;
    }

      if( user.profile.language === 'de' ){
          return de;
    }

      if( user.profile.language === 'it' ){
        return it;
    }

      if( user.profile.language === 'nl' ){
      return nl;
    }

      if( user.profile.language === 'es' ){
    return es;
    }

      if( user.profile.language === 'fr' ){
    return fr;
    }

      if( user.profile.language === 'ar' ){
    return ar;
    }

    return en;
};

Accounts.urls.verifyEmail = (token) => {
  return Meteor.absoluteUrl('app/shop/verify/' + token);
};

Accounts.urls.resetPassword = (token) => {
  return Meteor.absoluteUrl('app/reset/' + token);
};
