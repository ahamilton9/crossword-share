import { parseBinaryFile } from '@ajhyndman/puz'
import { Peer } from 'peerjs'

window.parseBinaryFile = parseBinaryFile

let currentPuzzle = null
let cellIndex = []
let answerIndex = {}

let url = new URL(window.location)
let path = url.pathname.substring(1)
if(path !== '') {
    // FINISH: Use as partner key
    console.log('My path is: ' + path)
}

// FINISH: PeerJS
const peer = new Peer({
    host: 'localhost',
    port: 9000,
    path: '/myapp',
})
peer.on('open', function(id) {
    console.log('My peer ID is: ' + id);
})

// FINISH: Default puzzle
fetch("https://cdn.glitch.global/99ae51ca-bc91-4033-8c17-179214ba1db9/Dec0193.puz?v=1709848368754")
    .then((res) => res.arrayBuffer())
    .then(function (arrayBuffer) {
        currentPuzzle = parseBinaryFile(arrayBuffer)

        // Validate
        if(currentPuzzle.isScrambled) {
            // FINISH: Unscrambling
            alert('Puzzle is scrambled. Currently unsupported. Sorry!')
        }
        if(currentPuzzle.rebus) {
            // FINISH: Rebus support
            alert('Rebus detected. Currently unsupported. Sorry!')
        }

        // Display puzzle info
        document.getElementById('title').innerHTML = currentPuzzle.title
        document.getElementById('author').innerHTML = currentPuzzle.author
        document.getElementById('copyright').innerHTML = currentPuzzle.copyright

        let x = 0
        let y = 0
        for (const c of currentPuzzle.solution) {
            if (x === currentPuzzle.width) {
                // Breaker
                document.querySelector('#grid').innerHTML += '<br />'
                x = 0
                y++
            }
            document.querySelector('#grid').innerHTML += '<span '
                + 'id="' + 'x' + x + 'y' + y + '" '
                +' class="cell' + (c === '.' ? ' solid' : '')
                + '">'
                + '<span class="cell-letter"></span>'
                + '</span>'

            // Index cell
            if(! cellIndex[x]) {
                cellIndex[x] = []
            }
            cellIndex[x][y] = {
                letter: c
            }

            x++
        }

        let currentNumber = 1
        let currentClue = 0
        for (let y = 0; y < currentPuzzle.height; y++) {
            for (let x = 0; x < currentPuzzle.width; x++) {
                let currentCell = cellIndex[x][y]
                let cellAbove = getCellOrNull(cellIndex, x, y - 1)
                let cellAfter = getCellOrNull(cellIndex, x + 1, y)
                let cellBelow = getCellOrNull(cellIndex, x, y + 1)
                let cellBefore = getCellOrNull(cellIndex, x - 1, y)
                if (currentCell.letter !== '.') {
                    // Cell has a letter
                    let down = false
                    let across = false
                    if (! isLetterCell(cellAbove) && isLetterCell(cellBelow)) {
                        // Cell starts a Down answer
                        down = true
                    }
                    if(! isLetterCell(cellBefore) && isLetterCell(cellAfter)) {
                        // Cell starts an Across answer
                        across = true
                    }

                    if(down || across) {
                        // Apply number to the grid
                        let numberElement = document.createElement('span')
                        numberElement.classList.add('number')
                        numberElement.innerHTML = currentNumber
                        document.getElementById('x' + x + 'y' + y).appendChild(numberElement)

                        // Match clues to their numbers
                        if (across) {
                            let answer = getAnswerFromGrid(x, y, 'across')
                            let acrossClueElement = document.createElement('div')
                            acrossClueElement.id = 'across' + currentNumber
                            acrossClueElement.innerHTML = '<b>' + currentNumber + ')</b> <span class="answer-length">[' + answer.length + ']</span> ' + currentPuzzle.clues[currentClue]
                            document.getElementById('across-content').appendChild(acrossClueElement)

                            // Index answer
                            if(answerIndex[answer] === undefined) {
                                answerIndex[answer] = []
                            }
                            answerIndex[answer].push({
                                clue: currentNumber,
                                direction: 'across',
                                x: x,
                                y: y
                            })

                            currentClue++
                        }
                        if (down) {
                            let answer = getAnswerFromGrid(x, y, 'down')
                            let downClueElement = document.createElement('div')
                            downClueElement.id = 'down' + currentNumber
                            downClueElement.innerHTML = '<b>' + currentNumber + ')</b> <span class="answer-length">[' + answer.length + ']</span> ' + currentPuzzle.clues[currentClue]
                            document.getElementById('down-content').appendChild(downClueElement)

                            // Index answer
                            if(answerIndex[answer] === undefined) {
                                answerIndex[answer] = []
                            }
                            answerIndex[answer].push({
                                clue: currentNumber,
                                direction: 'down',
                                x: x,
                                y: y
                            })

                            currentClue++
                        }
                        currentNumber++
                    }
                }
            }
        }
        // console.log(answerIndex)
    })

function getAnswerFromGrid(x, y, direction) {
    let answer = ''
    let nextCell
    do {
        answer += cellIndex[x][y].letter.toUpperCase()
        x = (direction === 'across' ? x + 1 : x)
        y = (direction === 'down' ? y + 1 : y)
        nextCell = getCellOrNull(cellIndex, x, y)
    } while(isLetterCell(nextCell))

    return answer
}

function getCellOrNull(arr, x, y){
    if (arr[x] === undefined || arr[x][y] === undefined) {
        return null
    }

    return arr[x][y]
}

function isLetterCell(cell) {
    return cell !== null && cell.letter !== '.'
}

// Chat form handling
document.getElementById('chat-form').addEventListener('submit', function(event) {
    event.preventDefault()

    let input = document.getElementById('chat-input')
    let value = input.value
    let log = document.getElementById('chat-log')

    // Reset chat input and siplay message in log
    input.value = ''
    log.innerHTML += '<div><b>You:</b> ' + value + '</div>' // FINISH: Indicate if this is an answer (move logic down a bit)
    log.scrollTop = log.scrollHeight;

    // Check if answer appears on the grid
    value = value.toUpperCase().trim().replace(/\s+/g, '')
    if(answerIndex[value] !== undefined) {
        // It does! Display it in all valid locations
        for(let i = 0; i < answerIndex[value].length; i++) {
            let answer = answerIndex[value][i]
            let x = answer.x
            let y = answer.y
            for (const c of value) {
                let cellLetter = document.querySelectorAll('#x' + x + 'y' + y + ' > .cell-letter')[0]
                if (cellLetter.innerHTML === '') {
                    cellLetter.innerHTML = c
                }
                if(answer.direction === 'across') {
                    x++
                } else {
                    y++
                }
            }

            // Cross out the clue
            document.getElementById(answer.direction + answer.clue).classList.add('strike')
        }

        // Go through each cell. If any are missing a letter, stop. Recreate string and compare to currentPuzzle.solution
        let solved = checkIfSolved()
        if(solved) {
            // FINISH
            alert('Solved!')
        }
    }
})

function checkIfSolved() {
    let state = ''

    // Make a string of the cells from left to right, top to bottom
    for (let y = 0; y < currentPuzzle.height - 1; y++) {
        for (let x = 0; x < currentPuzzle.width - 1; x++) {
            if(cellIndex[x][y].letter === '.') {
                state += '.'
            } else {
                let letter = document.querySelectorAll('#x' + x + 'y' + y + ' > .cell-letter')[0].innerHTML

                // If a cell is empty, puzzle can't be solved yet
                if(letter === '') {
                    return false
                }

                state += letter
            }
        }
    }

    return state === currentPuzzle.solution
}

// Unused data:
// markupGrid: Array(225) [ {…}, {…}, {…}, … ]
// misc: Object { unknown1: 0, unknown3: 1, scrambledChecksum: 0, … }