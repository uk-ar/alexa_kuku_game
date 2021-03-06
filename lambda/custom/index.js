/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/
"use strict";
const Alexa = require('alexa-sdk');
// ステートの定義
const states = {
  QUIZ: '_QUIZMODE',
  START: "_STARTMODE", // Entry point, start the game.
  HELP: "_HELPMODE" // The user is asking for help.
};

const q = require("./question");
const questions = q["QUESTIONS_JA_JP"]

//This is a list of positive speechcons that this skill will use when a user gets a correct answer.  For a full list of supported
//speechcons, go here: https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/speechcon-reference
const speechConsCorrect = ["イェイ","うふ","うふふ","うん","おおー","おめでとう","そうそう","万歳","ピンポーン","ふふっ","ふふふ","ほ〜","やった","やったあ","やっほう","やっほう","わ〜い"];

//This is a list of negative speechcons that this skill will use when a user gets an incorrect answer.  For a full list of supported
//speechcons, go here: https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/speechcon-reference
const speechConsWrong = ["あ〜あ","あちゃ","あちゃあ","あらら","ありゃ","あれれ","うぇーん","おっと","およよ","しくしく","とほほ","むっ"];

var languageString = {
    "ja-JP": {
        "translation": {
            "WELCOME_MESSAGE": "くくゲームへようこそ。 ",
            "HELP_MESSAGE": "正解だと思う数字を回答してください。",
            "START_MESSAGE": "ゲームを始める場合は「ゲームスタート」と言ってください。 ",
            "ANSWER_CORRECT_MESSAGE": "正解。 ",
            "ANSWER_WRONG_MESSAGE": "残念、不正解。 ",
            "TELL_QUESTION_MESSAGE": "第%s問。 ",
            "GAME_OVER_MESSAGE": "全ての問題が終わりました。あなたの点数は%s点でした。遊んでくれてありがとう。 ",
            "UNHANDLED_MESSAGE": "すみません、よく聞きとれませんでした。"
        }
    }
};

exports.handler = function(event, context, callback) {
  var alexa = Alexa.handler(event, context);
  alexa.resources = languageString;
  alexa.registerHandlers(handlers, startStateHandlers, quizHandlers);
  alexa.execute();
};

var handlers = {
  'LaunchRequest': function () {
    this.handler.state = states.START;
    this.emitWithState("StartGame",true);
  },
  "AMAZON.StartOverIntent": function() {
      this.handler.state = states.START;
      this.emitWithState("StartGame",true);
  },
  'AMAZON.HelpIntent': function () {
    this.emit(':ask', this.t("HELP_MESSAGE") + this.t("START_MESSAGE"));
  },
  'Unhandled': function () {
    var speechOutput = this.t("UNHANDLED_MESSAGE") + this.t("START_MESSAGE");
    this.emit(":ask", speechOutput, speechOutput);
  }
};
function getRandom(min, max)
{
    return Math.floor(Math.random() * (max-min+1)+min);
}

function getSpeechCon(type)
{

    if (type) return "<say-as interpret-as='interjection'>" + speechConsCorrect[getRandom(0, speechConsCorrect.length-1)] + "! </say-as><break strength='strong'/>";
    else return "<say-as interpret-as='interjection'>" + speechConsWrong[getRandom(0, speechConsWrong.length-1)] + " </say-as><break strength='strong'/>";
}

// ゲーム開始ステート
var startStateHandlers = Alexa.CreateStateHandler(states.START, {
    "StartGame": function () {
      this.handler.state = states.QUIZ; // クイズ回答ステートをセット
      this.attributes['advance'] = 1;   // 進行状況をセッションアトリビュートにセット
      this.attributes['correct'] = 0;   // 正解数を初期化
      this.attributes['currentQuestionIndex'] = Math.floor(Math.random() * questions.length)
      var message = this.t("WELCOME_MESSAGE") + this.t("HELP_MESSAGE") + this.t("TELL_QUESTION_MESSAGE", "1") + questions[this.attributes['currentQuestionIndex']].q;
      var reprompt = this.t("TELL_QUESTION_MESSAGE") + questions[this.attributes['currentQuestionIndex']].q;
      this.emit(':ask', message, reprompt); // 相手の回答を待つ
      console.log(message);
      console.log("arisawa");
    },
    "AMAZON.StartOverIntent": function() {
        this.handler.state = states.START;
        this.emitWithState("StartGame",false);
    },
    "AMAZON.StopIntent": function() {
        this.response.speak(this.t("GAME_OVER_MESSAGE", this.attributes['correct']));
        this.emit(":responseReady");
    },
    "AMAZON.PauseIntent": function() {
        this.response.speak(this.t("GAME_OVER_MESSAGE", this.attributes['correct']));
        this.emit(":responseReady");
    },
    "AMAZON.CancelIntent": function() {
        this.response.speak(this.t("GAME_OVER_MESSAGE", this.attributes['correct']));
        this.emit(":responseReady");
    },
    /*"AMAZON.HelpIntent": function() {
        //this.response.speak(this.t("HELP_MESSAGE")).listen(this.t("HELP_MESSAGE"));
        this.emit(":responseReady");
    }*/
});


// クイズ回答ステート
var quizHandlers = Alexa.CreateStateHandler(states.QUIZ, {
  'AnswerIntent': function() {

      // スロットから回答を参照
      //var usersAnswer = this.event.request.intent.slots.Number.value || this.event.request.intent.slots.LongNumber.resolutions.resolutionsPerAuthority.values.value.id;
      var usersAnswer = this.event.request.intent.slots.Number.value || (this.event.request.intent.slots.LongNumber.resolutions && this.event.request.intent.slots.LongNumber.resolutions.resolutionsPerAuthority[0].values[0].value.id)
      console.log("usersAnswer0",
                  this.event.request.intent.slots.LongNumber)
    if(!usersAnswer){
      this.emitWithState("Unhandled");
    }

    var resultMessage;
    //if(questions[this.attributes['advance']-1].a == usersAnswer){
    if(questions[this.attributes['currentQuestionIndex']].a == usersAnswer){
      resultMessage = getSpeechCon(true);
      resultMessage += this.t("ANSWER_CORRECT_MESSAGE")     //正解
      this.attributes['correct'] ++;
    }else{
      resultMessage = getSpeechCon(false);
      resultMessage += this.t("ANSWER_WRONG_MESSAGE")     //不正解
    }

    if(this.attributes['advance'] < questions.length){
        // まだ問題が残っている場合
      this.attributes['currentQuestionIndex']=Math.floor(Math.random() * questions.length)
        var nextMessage = this.t("TELL_QUESTION_MESSAGE", this.attributes['advance']+1) +
                          questions[this.attributes['currentQuestionIndex']].q;
        this.attributes['advance'] ++;
        this.emit(':ask', resultMessage+nextMessage, nextMessage);
    }else{
        // 全ての問題が終了した場合
        var endMessage = this.t("GAME_OVER_MESSAGE", this.attributes['correct'])
        // スキルを初期状態に戻すためステートをリセット
        this.handler.state = '';
        this.attributes['STATE'] = undefined;
        this.attributes['advance'] = 0;
        this.emit(':tell', resultMessage + endMessage, endMessage);
    }
  },
    "AMAZON.StartOverIntent": function() {
        this.handler.state = states.START;
        this.emitWithState("StartGame",false);
    },
    "AMAZON.StopIntent": function() {
        this.response.speak(this.t("GAME_OVER_MESSAGE", this.attributes['correct']));
        this.emit(":responseReady");
    },
    "AMAZON.PauseIntent": function() {
        this.response.speak(this.t("GAME_OVER_MESSAGE", this.attributes['correct']));
        this.emit(":responseReady");
    },
    "AMAZON.CancelIntent": function() {
        this.response.speak(this.t("GAME_OVER_MESSAGE", this.attributes['correct']));
        this.emit(":responseReady");
    },
  "AMAZON.RepeatIntent": function() {
    var nextMessage = this.t("TELL_QUESTION_MESSAGE", this.attributes['advance']) + questions[this.attributes['advance']-1].q;
    this.emit(':ask', nextMessage, nextMessage);
  },
  'Unhandled': function() {
    var reprompt = this.t("UNHANDLED_MESSAGE") + this.t("HELP_MESSAGE");
    this.emit(':ask', reprompt, reprompt);
  }
});
