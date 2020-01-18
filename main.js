let body = document.body

let setupTestDiv = document.getElementById("setupTestDiv")
let uploadFileInput = document.getElementById("uploadFile")
let textPasteInput = document.getElementById("pasteFile")

let startTestButton = document.getElementById("start-test")
let canStartTest = false


function shuffle(array) { // https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
  
    return array;
}

function makeAlert(type, text) {
    let alert = document.createElement("div")
    alert.className = "alert alert-" + type
    alert.role = "alert"
    alert.textContent = text
    return alert
}

function generateQuestionDiv(question, questionNumber, totalQuestions) {
    let div = document.createElement("div")
    let heading = document.createElement("h1")
    heading.textContent = "Question " + (questionNumber + 1) + " of " + totalQuestions
    
    let ask = document.createElement("p")
    ask.textContent = question.ask

    let object = {div: div}
    // call check on object to check it
    
    div.appendChild(heading)
    div.appendChild(ask)
    if (question.type == "multiple-choice") {
        let selected

        object.check = function() {
            let correct = (selected === question.correct)
            for (child of div.childNodes) {
                if (child.className == "form-check") {
                    for (child1 of child.childNodes) {
                        child1.disabled = true
                    }
                }
            }

            if (!correct) {
                div.insertBefore(makeAlert("danger", "You got it wrong! The correct answer was '" + question.choices[question.correct] + "' you chose '" + question.choices[selected] + ".'"), ask)
            } else {
                div.insertBefore(makeAlert("success", "You got it correct!"), ask) 
            }
            
            return correct
        }

        for (let i=0;i<question.choices.length;i++) {
            let choice = question.choices[i]
            let formCheck = document.createElement("div")
            formCheck.className = "form-check"

            let input = document.createElement("input")
            input.className = "form-check-input"
            input.name = "choiceRadios" + questionNumber
            input.id = "thisIsMyChoice" + choice + "," + questionNumber
            input.type = "radio"
            
            let label = document.createElement("label")
            label.className = "form-check-label"
            label.for = input.id
            label.textContent = choice

            input.addEventListener("click", () => {
                selected = i
            })
            formCheck.appendChild(input)
            formCheck.appendChild(label)
            div.appendChild(formCheck)
        }
    } else if (question.type == "type-out") {
        object.check = function() {
            let correct = true
            let mappedCorrect = question.correct.map(x => x.toLowerCase())
            let notMissing = []

            for (child of div.childNodes) {
                if (child.className == "form-control") {
                    let included = mappedCorrect.includes(child.value.toLowerCase())
                    if (!included) {
                        correct = false
                    } else {
                        notMissing[child.value.toLowerCase()] = true
                    }
                    child.disabled = true
                }
            }

            if (!correct) {
                let missing = question.correct.filter(x => (!notMissing[x])).map(x => "'" + x + "'")
                let mapped = question.correct.map(x => "'" + x + "'")
                
                div.insertBefore(makeAlert("danger", "You got it wrong! The corrects answer were '" + mapped.join(", ") + ". You were missing: " + missing.join(", ") + "."), ask)
            } else {
                div.insertBefore(makeAlert("success", "You got it correct!"), ask) 
            }
            
            return correct
        }

        for (let i=0;i<question.inputs;i++) {
            let input = document.createElement("input")
            input.type = "text"
            input.className = "form-control"
            input.style.marginBottom = "3px"
            
            div.appendChild(input)
        }
    } else if (question.type == "true-false") {
        let chosen = true

        let buttonGroup = document.createElement("div")
        buttonGroup.className = "btn-group btn-group-toggle"
        buttonGroup.style.marginBottom = "5px"
        buttonGroup.setAttribute("data-toggle", "buttons")

        let trueLabel = document.createElement("label")
        trueLabel.className = "btn btn-primary active"
        trueLabel.appendChild(document.createTextNode("true"))
        let trueButton = document.createElement("input")
        trueButton.type = "radio"
        trueButton.name = "trueOrFalse" + questionNumber
        trueButton.id = "trueButton" + questionNumber
        trueButton.autocomplete = "off"
        trueButton.checked = true
        trueButton.appendChild(document.createTextNode("true"))

        let falseLabel = document.createElement("label")
        falseLabel.className = "btn btn-primary"
        falseLabel.appendChild(document.createTextNode("false"))
        let falseButton = document.createElement("input")
        falseButton.type = "radio"
        falseButton.name = "trueOrFalse" + questionNumber
        falseButton.id = "falseButton" + questionNumber
        falseButton.autocomplete = "off"
        trueButton.addEventListener("click", () => {
            chosen = true
        })

        falseButton.addEventListener("click", () => {
            chosen = false
        })

        buttonGroup.appendChild(trueLabel)
        buttonGroup.appendChild(falseLabel)
        trueLabel.appendChild(trueButton)
        falseLabel.appendChild(falseButton)
        div.appendChild(buttonGroup)

        object.check = function() {
            let correct = (chosen === question.correct)
            falseButton.disabled = true
            trueButton.disabled = true

            if (!correct) {
                div.insertBefore(makeAlert("danger", "You got it wrong! The correct answer was " + question.correct.toString()), ask)
            } else {
                div.insertBefore(makeAlert("success", "You got it correct!"), ask) 
            }

            return correct
        }

    }

    return object
}

function checkIfValidTest(test) {
    if (!test.questions) return
    if (!test.title) return

    return true
}

function startTest() {
    let test = canStartTest
    if (!test) return
    if (!checkIfValidTest(test)) return

    if (test.random) {
        shuffle(test.questions)
    }

    let questionObjects = []
    let currentQuestion = 0
    
    for (let i=0;i<test.questions.length;i++) {
        questionObjects[i] = generateQuestionDiv(test.questions[i], i, test.questions.length)
    }

    setupTestDiv.style.display = "none"
    
    let nextQuestion = document.createElement("button")
    nextQuestion.className = "btn btn-primary"
    nextQuestion.style.marginLeft = "5px"
    nextQuestion.textContent = "next"

    let prevQuestion = document.createElement("button")
    prevQuestion.className = "btn btn-secondary"
    prevQuestion.textContent = "previous"

    function addDiv(div) {
        body.insertBefore(div, prevQuestion)
    }

    nextQuestion.addEventListener("click", () => {
        if (currentQuestion >= (test.questions.length-1)) { // test finished
            body.removeChild(questionObjects[currentQuestion].div)
            nextQuestion.style.display = "none"
            prevQuestion.style.display = "none"
            
            let correctAnswers = 0
            for (object of questionObjects) {
                let result = object.check()
                if (result) {correctAnswers++}
                addDiv(object.div)
            }

            let alert = makeAlert("info", "You got " + correctAnswers + " out of " + test.questions.length + " questions correct.")
            body.insertBefore(alert, body.firstChild)
        } else {
            body.removeChild(questionObjects[currentQuestion].div)
            currentQuestion += 1
            addDiv(questionObjects[currentQuestion].div)
            if (currentQuestion >= (test.questions.length-1)) {
                nextQuestion.className = "btn btn-success"
                nextQuestion.textContent = "finish"
            }
        }
    })

    prevQuestion.addEventListener("click", () => {
        if (currentQuestion > 0) {
            body.removeChild(questionObjects[currentQuestion].div)
            currentQuestion -= 1
            addDiv(questionObjects[currentQuestion].div)
            nextQuestion.className = "btn btn-primary"
            nextQuestion.textContent = "next"
        }
    })

    body.appendChild(prevQuestion)
    body.appendChild(nextQuestion)
    addDiv(questionObjects[currentQuestion].div)  
}

function checkIfCanStart() {
    let value = textPasteInput.value
    let couldStart = canStartTest
    let canParse = true

    try {
        canStartTest = JSON.parse(value)
    } catch {
        canParse = false
        canStartTest = false
    }

    if (canParse && canStartTest) {
        startTestButton.removeAttribute("disabled")
    } else if (couldStart) {
        startTestButton.setAttribute("disabled", true)
    }
}

uploadFileInput.addEventListener("change", async () => {
    let file = uploadFileInput.files.item(0)
    if ((file.type == "application/json") || (file.type == "text/plain")) {
        let text = await file.text()
        textPasteInput.value = text
        checkIfCanStart()
    }
})

startTestButton.addEventListener("click", startTest)
textPasteInput.addEventListener("change", checkIfCanStart)
checkIfCanStart()
