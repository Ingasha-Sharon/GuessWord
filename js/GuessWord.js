"use strict";
const page_play = 'play';
const page_about = 'about';
const page_fourlettergame = 'fourlettergame';
const page_fivelettergame = 'fivelettergame';
const page_sixlettergame = 'sixlettergame';
const page_stats = 'stats';
const page_history = 'history';

const kb_EndOfWord = 0;
const kb_EndOfGame = 1;
const kb_Ready = 2;
const kb_StartOfWord = 3;
const kb_PartOfWord = 4;
const kb_BadWord = 5;

const greyCode = 0;
const yellowCode = 1;
const greenCode = 2;
const paleCode = 3;

const grey = "grey";
const red = "red";
const green = "green";
const yellow = "yellow";
const empty = "empty";

const enabled = true;
const disabled = false;

const enableEement = false;
const disableElement = true;

const normalMode = 0;
const dailyMode = 1;
const GameRecord = function () {
    this.Timestamp = '';
    this.Result = '';
    this.Words = [];
};
const FirstWord = function () {
    this.Word = "";
    this.Wins = 0;
    this.Losses = 0;
}
const Global = function () {
    this.CurrentPos = 0;
    this.LastPos = -1;
    this.GridWidth = 5;
    this.CurrentRow = 0;
    this.ActiveCell = '';
    this.Positions = [
        "0_0", "0_1", "0_2", "0_3", "0_4", "0_5",
        "1_0", "1_1", "1_2", "1_3", "1_4", "1_5",
        "2_0", "2_1", "2_2", "2_3", "2_4", "2_5",
        "3_0", "3_1", "3_2", "3_3", "3_4", "3_5",
        "4_0", "4_1", "4_2", "4_3", "4_4", "4_5",
        "5_0", "5_1", "5_2", "5_3", "5_4", "5_5"
    ];
    this.Words = ['', '', '', '', '', ''];
    this.Mode = normalMode;
    this.LocalStorageAvailable = true;
    this.Alphabet = "abcdefghijklmnopqrstuvwxyz";
    this.Letter = " "
    this.CurrentPage = page_play;
    this.EndOfRow = false;
    this.EndOfGame = false;
    this.Won = false;
    this.TargetWord = "PRICE";
    this.KeyBoardState = kb_StartOfWord;
    this.ColorCodeQueue = [];
}
let g = new Global;
String.prototype.mysubstr = function (start, length) {
    // If start is negative, calculate start from the end of the string
    if (start < 0) {
        start = this.length + start;
    }

    // Ensure start is not less than 0
    start = Math.max(start, 0);

    // Calculate the end index based on start and length
    let end = start + length;

    // Use slice to get the substring
    return this.slice(start, end);
};
$(document).ready(function () {
    //
    // Load stylesheet based on screen size
    LoadSizingStyleSheet();

    const AttachEvents = function () {
        //
        // Add Events to Keyboard letter
        $(".key").on('click', function (e) {
            if ($(".key").prop('disabled')) {
                return;
            }
            let letter = e.target.id.toUpperCase();
            SetLetter(letter);
        });
        $(".gridletter").on('click', function (e) {
            if (g.EndOfGame) {
                return;
            }
            if (!g.EndOfRow) {
                beep();
            }
            else {
                ProcessGridClick(e.target.id);
            }
        });

        // Add Events to Enter key
        $("#enter").on('click', function (e) {
            ProcessEnter();
        });
        // Add Events to Backspace Key
        $("#backspace").on('click', function (e) {
            ProcessBackspace();
        });
        // Add event to message close button
        $("#closebutton").on('click', function (e) {
            HideMessage();
        });
        $("#closehistory").on('click', function (e) {
            EnableInput();
            ShowHide("page_history", "page_play");
        });
        $("#closeabout").on('click', function (e) {
            EnableInput();
            ShowHide("page_about", "page_play");
        });
        $(window).resize(function () {
            LoadSizingStyleSheet();
        });
    }
    document.addEventListener('keyup', function (e) {
        let key = e.key;
        let letter = "";
        let shift = e.shiftKey;
        let ctrl = e.ctrlKey;
        // Stop invoking debugger passing on "I".
        if (shift && ctrl) {
            return;
        }
        // Don't let copy/paste through
        if (ctrl && (key == "c" || key == "v")) {
            return;
        }
        switch (key) {
            case "Shift":
            case "Control":
            case "Alt":
                break;
            case "Backspace":
                ProcessBackspace();
                break;
            case "Enter":
                ProcessEnter();
                break;
            default:
                if ($(".key").prop('disabled')) {
                    return;
                }
                if (g.EndOfGame) {
                    return;
                }
                if (key >= "a" && key <= "z") {
                    letter = key.toUpperCase();
                }
                else if (key >= "A" && key <= "Z") {
                    letter = key;
                }
                if (letter != "") {
                    SetLetter(letter);
                }
                break;
        }
    });

    AttachEvents();
    SetColunmVisibility(5, false);
    LocalStorageAvailable();
    SetEmailField();
    SetCopyRight();
    StartGame();
});
const ProcessGridClick = function (id) {
    if (g.ActiveCell == id) {
        ClearActiveCellHighlight();
        return;
    }
    let row = parseInt(id.mysubstr(0, 1));
    if (row != g.CurrentRow) {
        beep();
        return;
    }
    let cellID = "";
    if (g.ActiveCell != "") {
        cellID = "#" + g.ActiveCell;
        $(cellID).removeClass("highlight");
    }
    g.ActiveCell = id;
    cellID = "#" + g.ActiveCell;
    $(cellID).addClass("highlight");
    // Allow keyboard to be used
    SetEnabledState(".key", enabled);
}
const ClearActiveCellHighlight = function () {
    if (g.ActiveCell != "") {
        $("#" + g.ActiveCell).removeClass("highlight");
        g.ActiveCell = "";
        if (g.KeyBoardState == kb_EndOfWord) {
            SetEnabledState(".key", disabled);
        }
    }
}
const ProcessEnter = function () {
    if ($("#enter").prop('disabled')) {
        return;
    }
    ClearActiveCellHighlight();
    if (g.KeyBoardState == kb_EndOfGame) {
        StartGame();
        return;
    }
    for (let i = 0; i < g.GridWidth; i++) {
        let letterID = GetID(g.CurrentRow, i);
        if ($(letterID).text() == '') {
            beep();
            return;
        }
    }
    if (WordAccepted(g.CurrentRow)) {
        if (g.CurrentRow <= 5 && !g.EndOfGame) {
            KeyBoardState(kb_StartOfWord);
        }
        else {
            KeyBoardState(kb_EndOfGame);
        }
    }
}
const beep = function () {
    const snd = new Audio("data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");
    snd.play();
}
const SetLetter = function (letter) {
    if (g.ActiveCell != "") {
        let id = "#" + g.ActiveCell;
        $(id).text(letter);
        if ($(id).hasClass(red)) {
            let row = parseInt(g.ActiveCell.mysubstr(0, 1));
            let guess = GetGuess(row);
            if (ValidWord(guess.toLowerCase())) {
                for (let i = 0; i < g.GridWidth; i++) {
                    let letterID = GetID(row, i);
                    ColorClassChange(letterID, empty);
                }
            }
        }
        ClearActiveCellHighlight();
        if (g.EndOfRow) {
            KeyBoardState(kb_EndOfWord);
        }
        else {
            KeyBoardState(kb_PartOfWord);
        }
        return;
    }

    if (g.EndOfRow) {
        beep();
        return;
    }
    g.LastPos = g.CurrentPos;
    $("#" + g.Positions[g.CurrentPos]).text(letter);
    let y = parseInt(g.Positions[g.CurrentPos].mysubstr(0, 1), 10);
    let x = parseInt(g.Positions[g.CurrentPos].mysubstr(2, 1), 10);
    g.EndOfRow = false;
    switch (g.GridWidth) {
        case 4:
            if (x == 3) {
                g.EndOfRow = true;
                g.CurrentPos += 3;
            }
            break;
        case 5:
            if (x == 4) {
                g.EndOfRow = true;
                g.CurrentPos += 2;
            }
            break;
        case 6:
            if (x == 5) {
                g.EndOfRow = true;
                g.CurrentPos += 1;
            }
            break;
        default:
            alert('oops');
    }
    if (!g.EndOfRow) {
        g.CurrentPos++;
        KeyBoardState(kb_PartOfWord);
    }
    else {
        KeyBoardState(kb_EndOfWord);
    }
}
const GetGuess = function (row) {
    let guess = '';
    for (let i = 0; i < g.GridWidth; i++) {
        let letterID = GetID(row, i);
        guess += $(letterID).text();
    }
    return guess;
}
const KeyClick = function (letter) {
    if ($(".key").prop('disabled')) {
        return;
    }
    SetLetter(letter);
}
const ProcessBackspace = function () {
    if ($("#backspace").prop('disabled')) {
        return;
    }
    if (g.LastPos < 0) {
        return;
    }
    ClearActiveCellHighlight();
    let y = parseInt(g.Positions[g.LastPos].mysubstr(0, 1), 10);
    let x = parseInt(g.Positions[g.LastPos].mysubstr(2, 1), 10);
    //if (x == g.GridWidth - 1) {
    //    return;
    //}
    $("#" + g.Positions[g.LastPos]).text('');
    for (let i = x; i >= 0; i--) {
        let letterID = GetID(y, i);
        ColorClassChange(letterID, empty);
    }
    g.CurrentPos = g.LastPos;
    g.LastPos -= 1;
    g.EndOfRow = false;
    if (x > 0) {
        KeyBoardState(kb_PartOfWord);
    }
    else {
        KeyBoardState(kb_StartOfWord);
    }
}
const WordAccepted = function (row) {
    g.ColorCodeQueue = [];
    let letter = '';
    let letterID = '';
    let originalguess = '';
    let guess = GetGuess(row);
    originalguess = guess;
    let found = ValidWord(guess.toLowerCase());
    if (!found) {
        for (let i = 0; i < g.GridWidth; i++) {
            let letterID = GetID(row, i);
            AnimateColorClassChange(letterID, red);
        }
        KeyBoardState(kb_BadWord);
        return false;
    }
    else {
        //
        // Set all letters in grid to grey (missing)
        for (let i = 0; i < g.GridWidth; i++) {
            let letterID = GetID(row, i);
            let letter = guess.mysubstr(i, 1);
            let keyID = "#" + letter.toLowerCase();
            AnimateColorClassChange(letterID, grey);
            AnimateColorClassChange(keyID, grey);
        }
        let targetWord = g.TargetWord;
        //
        // Loop through the target word looking for exact matches
        for (let i = 0; i < g.GridWidth; i++) {
            let letter = guess.mysubstr(i, 1);
            if (letter == targetWord.mysubstr(i, 1)) {
                letterID = GetID(row, i);
                let keyID = "#" + letter.toLowerCase();
                AnimateColorClassChange(letterID, green);
                AnimateColorClassChange(keyID, green);
                targetWord = HideMatch(targetWord, i, '?');
                guess = HideMatch(guess, i, '!');
            }
        }
        //
        // Loop through the target word looking for inexact matches
        for (let i = 0; i < g.GridWidth; i++) {
            let letter = guess.mysubstr(i, 1);
            let pos = targetWord.indexOf(letter);
            if (pos >= 0) {
                letterID = GetID(row, i);
                let keyID = "#" + letter.toLowerCase();
                AnimateColorClassChange(letterID, yellow);
                AnimateColorClassChange(keyID, yellow);
                targetWord = HideMatch(targetWord, pos, '?');
                guess = HideMatch(guess, i, '!');
            }
        }
        g.TargetWord = g.TargetWord.toUpperCase();
        originalguess = originalguess.toUpperCase();
        g.Words[g.CurrentRow] = originalguess;
        g.Won = originalguess == g.TargetWord
        if (g.Won || g.CurrentRow == 5) {
            g.EndOfGame = true;
            KeyBoardState(kb_EndOfGame);
            letterID = GetID(g.CurrentRow + 1, 0);
            // Display finish message after tiles colored - note CurrentRow is incremented before timeout executes
            setTimeout(function () { ShowMessage(GetMessage(g.CurrentRow + (g.Won ? -1 : 0)), letterID, DoNothing) }, 2000);
        }
        g.CurrentRow++;
        g.EndOfRow = false;
        KeyBoardState(kb_StartOfWord);
        return true;
    }
}
const HideMatch = function (word, pos, flag) {
    let str = word.split('');
    str[pos] = flag;
    word = str.join('');
    return word;
}
const LoadSizingStyleSheet = function () {
    let screensize = $(window).width();
    let size = "Full";
    for (let screensizes = 320; screensizes <= 1024; screensizes += 4) {
        if (screensize <= screensizes) {
            size = screensizes;
            break;
        }
    }
    let version = $("#version").text().trim();
    if (version != "") {
        version = "_" + version.replace(".", "_");
    }

    $("#screensize").attr("href", "css/GuessWord" + size + version + ".css");
    setTimeout(function () {
        SetGameName();
    }, 100);
}
const SetGameName = function () {
    let screensize = $(window).width();
    let headerHeight = parseInt($("#fixedheader").height());
    $("#page_play").css("margin-top", (headerHeight + 8).toString() + "px");
    // $("#gamename").text("GuessWord (" + g.GridWidth.toString() + " letters)"); //$(window).width().toString() + "x" + $(window).height().toString());
}
const AnimateColorClassChange = function (id, newClass) {
    let element = $(id);
    if (!element.length) return;

    // Add an event listener for the animationstart event
    element.one('animationstart', function () {
        ChangeElementColor(element, newClass);
    });

    // Trigger the animation
    element.css('animation-name', 'none');
    element[0].offsetHeight; // Trigger reflow
    element.css('animation-name', 'rotate');
}
const ColorClassChange = function (id, newClass) {
    let element = $(id);
    ChangeElementColor(element, newClass);
}
const ChangeElementColor = function (element, newClass) {
    if (newClass !== 'empty' && element.hasClass('empty')) {
        element.removeClass('empty');
    }
    if (newClass !== 'red' && element.hasClass('red')) {
        element.removeClass('red');
    }
    if (newClass !== 'green' && element.hasClass('green')) {
        element.removeClass('green');
    }
    if (newClass !== 'yellow' && element.hasClass('yellow')) {
        element.removeClass('yellow');
    }
    if (newClass !== 'grey' && element.hasClass('grey')) {
        element.removeClass('grey');
    }
    element.addClass(newClass);
}
const ShowHide = function (hideThisID, showThisID) {
    if ($("#" + hideThisID).hasClass("w3-show")) {
        $("#" + hideThisID).removeClass("w3-show");
    }
    $("#" + hideThisID).addClass("w3-hide");

    if ($("#" + showThisID).hasClass("w3-hide")) {
        $("#" + showThisID).removeClass("w3-hide");
    }
    $("#" + showThisID).addClass("w3-show");
}
const ValidWord = function (word) {
    let valid = true;
    switch (g.GridWidth) {
        case 4:
            if (BinSearch(_FullDict4, word) < 0) {
                valid = false;
            }
            break;
        case 5:
            if (BinSearch(_FullDict5, word) < 0) {
                valid = false;
            }
            break;
        case 6:
            if (BinSearch(_FullDict6, word) < 0) {
                valid = false;
            }
            break;
        default:
            alert('oops');
    }
    return valid;
}
const BinSearch = function (dictonary, word) {
    if (!dictonary.length) return -1;

    let high = dictonary.length - 1;
    let low = 0;
    let mid = 0;
    while (low <= high) {
        mid = parseInt((low + high) / 2);
        const element = dictonary[mid];
        if (element > word) {
            high = mid - 1;
        }
        else if (element < word) {
            low = mid + 1;
        }
        else {
            return mid;
        }
    }
    return -1;
};
const Occurs = function (word, letter) {
    let count = 0;
    for (let i = 0; i < word.Length; i++) {
        if (word.mysubstr(i, 1) == letter) {
            count++;
        }
    }
    return count;
}
const SetEnabledState = function (id, state) {
    if (id == "#") {
        alert("bug");
        debugger;
        return;
    }
    if (state == disabled) {
        $(id).prop('disabled', true);
        $(id).css('color', "grey");
    }
    else {
        $(id).prop('disabled', false);
        $(id).css('color', "black");
    }
}
const KeyBoardState = function (kb_State) {
    g.KeyBoardState = kb_State;
    switch (kb_State) {
        case kb_Ready:
            SetEnabledState(".key", enabled);
            SetEnabledState("#enter", disabled);
            SetEnabledState("#backspace", disabled);
            break;
        case kb_PartOfWord:
            SetEnabledState(".key", enabled);
            SetEnabledState("#enter", disabled);
            SetEnabledState("#backspace", enabled);
            break;
        case kb_BadWord:
            SetEnabledState(".key", disabled);
            SetEnabledState("#enter", disabled);
            SetEnabledState("#backspace", enabled);
            break;
        case kb_EndOfWord:
            SetEnabledState(".key", disabled);
            SetEnabledState("#enter", enabled);
            SetEnabledState("#backspace", enabled);
            break;
        case kb_EndOfGame:
            SetEnabledState(".key", disabled);
            SetEnabledState("#enter", enabled);
            SetEnabledState("#backspace", disabled);
            break;
        case kb_StartOfWord:
            SetEnabledState(".key", enabled);
            SetEnabledState("#enter", disabled);
            SetEnabledState("#backspace", disabled);
            break;
        default:
            alert("oops");
    }
}
const StartGame = function () {
    if (g.GameInProgress) {
        return;
    }
    EnableInput();
    ShowHide("page_history", "page_play");
    HideMessage();
    g.CurrentPos = 0;
    g.CurrentRow = 0;
    g.EndOfGame = false;
    g.Words = [];
    ClearGrid();
    ClearKeyBoard();
    KeyBoardState(kb_Ready);
    SetTargetWord();
}
const ClearGrid = function () {
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 6; j++) {
            let id = GetID(i, j);
            ColorClassChange(id, empty);
            $(id).text("");
        }
    }
}
const ClearKeyBoard = function () {
    for (let i = 0; i < 26; i++) {
        let id = "#" + g.Alphabet.mysubstr(i, 1);
        ColorClassChange(id, empty);
    }
    ColorClassChange("#backspace", empty);
    ColorClassChange("#enter", empty);
}
const SwitchBoardMargin = function (gridWidth) {
    if ($('#boardleftmargin').hasClass("fourcolmargin")) {
        $('#boardleftmargin').removeClass("fourcolmargin");
    }
    else if ($('#boardleftmargin').hasClass("fivecolmargin")) {
        $('#boardleftmargin').removeClass("fivecolmargin");
    }
    if ($('#boardleftmargin').hasClass("sixcolmargin")) {
        $('#boardleftmargin').removeClass("sixcolmargin");
    }

    switch (gridWidth) {
        case page_fourlettergame:
            $('#boardleftmargin').addClass("fourcolmargin");
            break;
        case page_fivelettergame:
            $('#boardleftmargin').addClass("fivecolmargin");
            break;
        case page_sixlettergame:
            $('#boardleftmargin').addClass("sixcolmargin");
            break;
        default:
            alert('oops');
    }
}
const GetID = function (row, col) {
    return "#" + row.toString() + "_" + col.toString();
}
const GetColorClass = function (letterID) {
    if ($(letterID).hasClass(green)) {
        return green;
    }
    if ($(letterID).hasClass(yellow)) {
        return yellow;
    }
    if ($(letterID).hasClass(grey)) {
        return grey;
    }
    if ($(letterID).hasClass(red)) {
        return red;
    }
    return empty;
}
const SetGridWidth = function (gridWidth, mode) {
    HideDropDownBody('gamesdropdown');
    g.Mode = mode;
    g.GameInProgress = false;
    SwitchBoardMargin(gridWidth);
    switch (gridWidth) {
        case page_fourlettergame:
            g.GridWidth = 4;
            SetColunmVisibility(4, false);
            SetColunmVisibility(5, false);
            break;
        case page_fivelettergame:
            g.GridWidth = 5;
            SetColunmVisibility(4, true);
            SetColunmVisibility(5, false);
            break;
        case page_sixlettergame:
            g.GridWidth = 6;
            SetColunmVisibility(4, true);
            SetColunmVisibility(5, true);
            break;
        default:
            alert('oops');
    }
    SetGameName();
    StartGame();
}
const SetColunmVisibility = function (column, state) {
    for (let i = 0; i < 6; i++) {
        let id = GetID(i, column);
        if (state) {
            $(id).show();
        }
        else {
            $(id).hide();
        }
    }
}
const HideDropDownBody = function (id) {
    let leftshift = '-100' + $('#' + id).css('left');
    $('#' + id).css('left', leftshift);
}
const ShowDropDownBody = function (id) {
    let position = $("#" + id).css('left');
    if (position.startsWith("-100")) {
        $('#' + id).css('left', position.mysubstr(4));
    }
}
const ShowPage = function (pageRef) {
}
const SetTargetWord = function () {
    let lastGameIndex = 0;
    //
    // Make certain different users each get different starting indexes
    switch (g.GridWidth) {
        case 4:
            lastGameIndex = Math.floor(Math.random() * _TargetDict4.length);
            break;
        case 5:
            lastGameIndex = Math.floor(Math.random() * _TargetDict5.length);
            break;
        case 6:
            lastGameIndex = Math.floor(Math.random() * _TargetDict6.length);
            break;
    }

    if (localStorage.LastGameIndex) {
        lastGameIndex = Number(localStorage.LastGameIndex) + 1;
        switch (g.GridWidth) {
            case 4:
                if (lastGameIndex >= _RandomRow4.length) {
                    lastGameIndex = 0;
                }
                break;
            case 5:
                if (lastGameIndex >= _RandomRow5.length) {
                    lastGameIndex = 0;
                }
                break;
            case 6:
                if (lastGameIndex >= _RandomRow6.length) {
                    lastGameIndex = 0;
                }
                break;
        }
    }
    localStorage.LastGameIndex = lastGameIndex;

    let x = 0;
    switch (g.GridWidth) {
        case 4:
            x = _RandomRow4[lastGameIndex];
            while (x >= _TargetDict4.Length) {
                lastGameIndex++;
                x = _RandomRow4[lastGameIndex];
            }
            g.TargetWord = _TargetDict4[x].toUpperCase();
            break;
        case 5:
            x = _RandomRow5[lastGameIndex];
            while (x >= _TargetDict5.Length) {
                lastGameIndex++;
                x = _RandomRow5[lastGameIndex];
            }
            if (g.Mode == dailyMode) {
                if (g.LocalStorageAvailable) {
                    let today = new Date();
                    let dateToday = today.getFullYear().toString() + "/" + today.getMonth().toString() + "/" + today.getDate().toString();
                    let datePlayed = localStorage.getItem("gwchallenge");
                    if (dateToday == datePlayed) {
                        ShowMessage(GetMessage(8), "#keyboard", DoNothing);
                        return;
                    }
                    localStorage.setItem("gwchallenge", dateToday);
                }
                x = GetXForToday();
            }
            g.TargetWord = _TargetDict5[x].toUpperCase();
            break;
        case 6:
            x = _RandomRow5[lastGameIndex];
            while (x >= _TargetDict6.Length) {
                lastGameIndex++;
                x = _RandomRow6[lastGameIndex];
            }
            g.TargetWord = _TargetDict6[x].toUpperCase();
            break;
        default:
            alert('oops');
    }
}
const GetXForToday = function () {
    let d = [2820, 1010, 2859, 1648, 1495, 986, 466, 991, 378, 590, 1460, 2239, 1754, 207, 2984, 1889, 890, 238, 3081, 2665, 2269, 1913, 2636, 2614, 1603, 1817, 173, 1093, 2265, 1863, 2029];
    let m = [340, 945, 929, 419, 327, 561, 758, 574, 623, 839, 624, 1002];
    let dow = [517, 415, 490, 598, 400, 519, 327];
    let currDate = new Date();
    let dx = currDate.getDate();
    let mx = currDate.getMonth();
    let dowx = currDate.getDay();
    return (d[dx - 1] * m[mx - 1] * dow[dowx]) % _TargetDict5.length;
}
const ShowMessage = function (message, topID, CloseFunction) {
    $("#closebutton").off("click");
    $("#closebutton").one("click", CloseFunction);
    DisableInput(0.65);
    if (!topID) {
        topID = '#3_0';
    }
    $('#message').removeClass('w3-hide').addClass("w3-show");
    let msgWidth = parseInt($("#menu").width());
    $('#message').css('left', parseInt(msgWidth / 18).toString() + "px");
    let offset = $(topID).offset();
    $('#message').css('top', parseInt(offset.top).toString() + "px");
    $('#message').css('width', (parseInt((msgWidth * 9) / 10)).toString() + "px");
    $('#message').css('height', 'auto');
    $('#messagetext').html(message);
};
const PxToInt = function (pxString) {
    if (pxString.indexOf('px') >= 0) {
        pxString = pxString.replace('px', '');
    }
    return parseInt(pxString);
}
const HideMessage = function () {
    if ($('#message').hasClass('w3-hide')) {
        return;
    }
    $('#message').hide(500, "swing", CompleteHideMessage);
};
const CompleteHideMessage = function () {
    $('#message').removeClass("w3-show").addClass('w3-hide');
    $("#msgicon").attr('src', '');
    EnableInput();
}
const EnableInput = function () {
    $("#modalpopup").removeClass("w3-show").addClass("w3-hide");
};
const DisableInput = function (opacity) {
    if (opacity) {
        $("#modalpopup").css("opacity", opacity);
    }
    else {
        $("#modalpopup").css("opacity", 0.65);
    }
    let popupwidth = $("#fixedheader").width() * 1.05;
    $("#modalpopup").removeClass("w3-hide");
    $("#modalpopup").addClass("w3-show");
    $("#modalpopup").width(popupwidth);
};
const SaveGameResult = function () {
    if (g.LocalStorageAvailable) {
        // Record date/time, win/lose, & guesses taken
        let today = new Date();
        let key = today.getTime().toString();
        localStorage.setItem(key, (g.Won ? "W," : "L,") + g.Words.join(","));
        ClearStateOfGame();
    }
    HideMessage();
}
const SetInputState = function (state) {
    if (state == enableEement) {
        $("#modalpopup").removeClass("w3-show").addClass("w3-hide");
    }
    else {
        let width = $("#fixedheader").width() * 1.1;
        let height = $(window).height - $("#fixedheader").height() * 1.1;
        $("#modalpopup").removeClass("w3-hide").addClass("w3-show").width(width).height(height);
    }
}
const ShowAbout = function () {
    HideMessage();
    DisableInput(0.65);
    ShowHide("page_play", "page_about");
}
const ShowHistory = function () {
    let gameRecords = [];
    let turns = [0, 0, 0, 0, 0, 0, 0];
    let gamesPlayed = 0;
    let gamesWon = 0;
    let gamesLost = 0;
    let longestStreak = 0;
    let first = true;
    let currentStreak = 0;

    $("#turns").text("Turns Taken");
    HideMessage();
    DisableInput(0.65);
    ShowHide("page_play", "page_history");
    for (let i = 0; i < localStorage.length; i++) {
        let gameRecord = new GameRecord();
        if (isNaN(localStorage.key(i))) {
            continue;
        }
        gameRecord.Timestamp = parseInt(localStorage.key(i));
        if (gameRecord.Timestamp < 1576800000000) {
            continue;
        }
        const items = localStorage.getItem(gameRecord.Timestamp).split(',');
        if (items.length < 2) {
            continue;
        }
        if (items[1] === undefined || items[1] === '') {
            continue;
        }
        gameRecord.Result = items[0];
        for (let j = 1; j <= 6; j++) {
            if (items[j]) {
                gameRecord.Words.push(items[j]);
            }
        }
        let maxturns = -1;
        switch (gameRecord.Words.length) {
            case 0:
                break;
            case 1:
                turns[0] = turns[0] + 1;
                break;
            case 2:
                turns[1] = turns[1] + 1;
                break;
            case 3:
                turns[2] = turns[2] + 1;
                break;
            case 4:
                turns[3] = turns[3] + 1;
                break;
            case 5:
                turns[4] = turns[4] + 1;
                break;
            case 6:
                if (gameRecord.Result == "W") {
                    turns[5] = turns[5] + 1
                }
                break;
            default:
                alert("oops");
        }
        gameRecords.push(gameRecord);
    }
    if (gameRecords.length == 0) {
        $("#turns").text("No Turns Taken");
        return;
    }
    gameRecords.sort((a, b) => {
        return a.Timestamp - b.Timestamp;
    });

    for (let i = 0; i < gameRecords.length; i++) {
        gamesPlayed++;
        if (gameRecords[i].Result == "W") {
            gamesWon++;
            currentStreak++;
            if (first) {
                longestStreak++;
            }
        }
        else {
            gamesLost++;
            if (currentStreak > longestStreak) {
                longestStreak = currentStreak;
            }
            currentStreak = 0;
            first = false;
        }
    }
    let maxturns = -1;
    for (let i = 0; i < turns.length; i++) {
        if (turns[i] > maxturns) {
            maxturns = turns[i];
        }
    }
    $("#gamesplayed").text(gamesPlayed);
    $("#gameswon").text(gamesWon);
    $("#gameslost").text(gamesLost);
    $("#longeststreak").text(longestStreak > currentStreak ? longestStreak : currentStreak);
    $("#currentstreak").text(currentStreak);

    $("#oneturn").text(turns[0]);
    $("#twoturns").text(turns[1]);
    $("#threeturns").text(turns[2]);
    $("#fourturns").text(turns[3]);
    $("#fiveturns").text(turns[4]);
    $("#sixturns").text(turns[5]);
    $("#lostgame").text(gamesLost);

    let divWidth = PxToInt($("#basicstats").css("width")) - 140;

    $("#oneturn").css("width", ((divWidth * turns[0] / maxturns) + 20) + "px");
    $("#twoturns").css("width", ((divWidth * turns[1] / maxturns) + 20) + "px");
    $("#threeturns").css("width", ((divWidth * turns[2] / maxturns) + 20) + "px");
    $("#fourturns").css("width", ((divWidth * turns[3] / maxturns) + 20) + "px");
    $("#fiveturns").css("width", ((divWidth * turns[4] / maxturns) + 20) + "px");
    $("#sixturns").css("width", ((divWidth * turns[5] / maxturns) + 20) + "px");
    $("#lostgame").css("width", ((divWidth * gamesLost / maxturns) + 20) + "px");

    gameRecords.sort((a, b) => {
        try {
            return a.Words[0].localeCompare(b.Words[0]);
        }
        catch (err) {
            // alert(err.message);
            return -1;
        }
    });

    let firstWords = [];
    let firstWord = new FirstWord();
    for (let i = 0; i < gameRecords.length; i++) {
        if (i == 0) {
            firstWord.Word = gameRecords[0].Words[0];
            if (gameRecords[0].Result == "W") {
                firstWord.Wins = 1;
            }
            else {
                firstWord.Losses = 1;
            }
        }
        else if (gameRecords[i].Words[0] != gameRecords[i - 1].Words[0]) {
            firstWords.push(firstWord);
            firstWord = new FirstWord();
            firstWord.Word = gameRecords[i].Words[0];
            if (gameRecords[i].Result == "W") {
                firstWord.Wins = 1;
            }
            else {
                firstWord.Losses = 1;
            }
        }
        else {
            if (gameRecords[i].Result == "W") {
                firstWord.Wins = firstWord.Wins + 1;
            }
            else {
                firstWord.Losses = firstWord.Losses + 1;
            }
        }
    }
    firstWords.sort((a, b) => {
        return b.Wins - a.Wins;
        //    return (a.Wins + a.Losses) - (b.Wins + b.Losses);
    });
    $("#firstword").text(" 1st word " + firstWords[0].Word + " - Won: " + firstWords[0].Wins.toString() + " Lost: " + firstWords[0].Losses.toString());
}
const GetMessage = function (currentRow) {
    let message = '';
    switch (currentRow) {
        case 0:
            $("#msgicon").attr('src', 'img/HoleInOne.png')
            message = "Amazing - you scored a hole in one!";
            break;
        case 1:
            $("#msgicon").attr('src', 'img/Eagle.png')
            message = "Fabulous play - you made an eagle!";
            break;
        case 2:
            $("#msgicon").attr('src', 'img/birdie.png')
            message = "Such great skill - you sunk a birdie!";
            break;
        case 3:
            $("#msgicon").attr('src', 'img/par.png')
            message = "Steady as a rock - you made par!";
            break;
        case 4:
            $("#msgicon").attr('src', 'img/Bogey.png')
            message = "You got there - you scored a bogey!";
            break;
        case 5:
            $("#msgicon").attr('src', 'img/doublebogey.png')
            message = "You just made the cut with that double bogey!";
            break;
        case 6:
            $("#msgicon").attr('src', 'img/Alligator.png')
            message = "You landed in a lake full of alligators! The word was " + g.TargetWord;
            break;
        case 7:
            $("#msgicon").attr('src', 'img/HalLight.png');
            message = "I'm sorry, Dave, I'm afraid I can't do that.";
            break;
        case 8:
            $("#msgicon").attr('src', 'img/Incomplete.png');
            message = "You've already attempted the Daily Challenge.";
            break;
        default:
            alert('oops');
    }
    return message;
}
const ClearLossesOnly = function () {
    if (confirm("Are you certain you want to erase all your losses?")) {
        ShowHide("page_history", "page_play");
        ShowMessage(GetMessage(7), "#3_0", DoNothing);
    }
}
const DoNothing = function () {
    // dummy to pass to ShowMessage if no further action required
    HideMessage();
}
const ClearHistory = function () {
    if (confirm("Are you certain you want to erase all your history?")) {
        let gameRecords = [];

        HideMessage();
        DisableInput(0.65);
        ShowHide("page_play", "page_history");
        for (let i = 0; i < localStorage.length; i++) {
            let gameRecord = new GameRecord();
            if (isNaN(localStorage.key(i))) {
                continue;
            }
            gameRecord.Timestamp = parseInt(localStorage.key(i));
            if (gameRecord.Timestamp < 1576800000000) {
                continue;
            }
            localStorage.removeItem(gameRecord.Timestamp).split(',');
        }
    }
}
const LocalStorageAvailable = function () {
    try {
        if (window.localStorage === undefined) {
            g.LocalStorageAvailable = false;
        }
    }
    catch (e) {
        alert('oops');
        return;
    }
}
// Fill in eMail fields.
// Create Base64 Object
// https://scotch.io/tutorials/how-to-encode-and-decode-strings-with-base64-in-javascript
const Base64 = { _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", encode: function (e) { var t = ""; var n, r, i, s, o, u, a; var f = 0; e = Base64._utf8_encode(e); while (f < e.length) { n = e.charCodeAt(f++); r = e.charCodeAt(f++); i = e.charCodeAt(f++); s = n >> 2; o = (n & 3) << 4 | r >> 4; u = (r & 15) << 2 | i >> 6; a = i & 63; if (isNaN(r)) { u = a = 64 } else if (isNaN(i)) { a = 64 } t = t + this._keyStr.charAt(s) + this._keyStr.charAt(o) + this._keyStr.charAt(u) + this._keyStr.charAt(a) } return t }, decode: function (e) { var t = ""; var n, r, i; var s, o, u, a; var f = 0; e = e.replace(/[^A-Za-z0-9+/=]/g, ""); while (f < e.length) { s = this._keyStr.indexOf(e.charAt(f++)); o = this._keyStr.indexOf(e.charAt(f++)); u = this._keyStr.indexOf(e.charAt(f++)); a = this._keyStr.indexOf(e.charAt(f++)); n = s << 2 | o >> 4; r = (o & 15) << 4 | u >> 2; i = (u & 3) << 6 | a; t = t + String.fromCharCode(n); if (u != 64) { t = t + String.fromCharCode(r) } if (a != 64) { t = t + String.fromCharCode(i) } } t = Base64._utf8_decode(t); return t }, _utf8_encode: function (e) { e = e.replace(/rn/g, "n"); var t = ""; for (var n = 0; n < e.length; n++) { var r = e.charCodeAt(n); if (r < 128) { t += String.fromCharCode(r) } else if (r > 127 && r < 2048) { t += String.fromCharCode(r >> 6 | 192); t += String.fromCharCode(r & 63 | 128) } else { t += String.fromCharCode(r >> 12 | 224); t += String.fromCharCode(r >> 6 & 63 | 128); t += String.fromCharCode(r & 63 | 128) } } return t }, _utf8_decode: function (e) { var t = ""; var n = 0; var c1, c2; var r = c1 = c2 = 0; while (n < e.length) { r = e.charCodeAt(n); if (r < 128) { t += String.fromCharCode(r); n++ } else if (r > 191 && r < 224) { c2 = e.charCodeAt(n + 1); t += String.fromCharCode((r & 31) << 6 | c2 & 63); n += 2 } else { c2 = e.charCodeAt(n + 1); c3 = e.charCodeAt(n + 2); t += String.fromCharCode((r & 15) << 12 | (c2 & 63) << 6 | c3 & 63); n += 3 } } return t } }
const DeveloperEmail = function () {
    return Base64.decode('cGF0amRvb2xleUB5YWhvby5jb20=');
}
const SetEmailField = function () {
    let developerEmail = DeveloperEmail();
    $('#DeveloperEmail').attr('href', 'mailto:' + developerEmail);
}
const SetCopyRight = function () {
    let currentTime = new Date();
    $('#copyright').html("&copy;" + currentTime.getFullYear().toString() + " Pat Dooley")
    $('#aboutcopyright').html("&copy;" + currentTime.getFullYear().toString() + " Pat Dooley")
}