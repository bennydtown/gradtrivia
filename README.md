# 5 Grad Trivia

A mobile web game that will be played by party guests.  The party is celebrating the graduation of 5 cousins this year: Solie is graduating from Middle School, Diego and Levi from High school, Lars from College and Lucia from a Masters Degree program.

## Joining the Game

* We will print posters with QR codes for guests to join the game.  
* Guests are shown a brief intro and how to play and rules  
  * Graduates are not allowed to answer questions but they can tell you who might be able to answer a question.  
* Guests give themselves a player name and start playing

## Game Play

* Most Questions are about one grad  
  * The exception is a set of “Guess Who” questions where you need to choose the grad who matches the question  
* Random Question order, different for each player  
  * Make sure a particular player only gets each question once though.  
* All questions multiple choice (single-select)  
* Show choices in random order  
* It tells you if you got it right or wrong, but doesn’t tell you the right answer if you were wrong.  
* Shows you a random picture of the grad after you answer  
* Once you’ve answered all questions, it shows you your score.  
* You get an overall score and also a score for each graduate

* QR code that guests can scan to join  
* Play at your own pace  
* Live High score list  
  * Allows user to view the top 10 overall scores and top scores for questions about each grad  
  * User can toggle between   
* Game Play  
  * Most questions are about one grad  
    * Except there is a group of questions where you’re guessing the person who matches the question.  
  * Random Question order  
  * All questions multiple choice  
  * Show choices in random order  
  * After answering, It tells you if you got it right or wrong, but doesn’t tell you right answer if you were wrong.  
    * The right/wrong page also includes a random image of the relevant grad.  
      * If it was a question about a specific grad, it shows you a random image of that grad  
      * If it was a Guess Who question, it shows you a random image of the grad you selected, regardless of whether you were right or wrong.  This is to avoid unintentionally showing the user the correct answer if they were wrong.

## End Game Functionality

* Once you’ve answered all questions, it shows you a score view  
  * Number of right/wrong you got overall  
  * Number of right/wrong you got for each grad  
* User can toggle between their score view and the top score lists

## Admin Functionality

* Password protected Admin section  
* No links in game to admin \- user must know url  
* Allows admin to manage images of grads  
* Allows CRUD control of questions  
* Admin section also has a custom Live High Score List  
  * This will periodically toggle between Overall and Grad-specific Scores.  
  * We will project this view during the party  
  * Optimize this view for a typical laptop screen rather than mobile

## Hosting Environment

When we’re ready to deploy this, I’d like a list of hosting services that prioritize ease of deployment.  I would like the hosting price to be under $20/month.