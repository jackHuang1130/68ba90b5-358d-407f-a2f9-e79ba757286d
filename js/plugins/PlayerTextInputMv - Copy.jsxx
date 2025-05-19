/*:
 * @plugindesc [RPG Maker MV] [Version 2.1.0] [Gamer Tool Studio]
 * @Gamer Tool Studio
 *
 * @help
 * This plugin provides a flexible input system where players can type text, 
 * with optional actor face images shown alongside the input text in the message window
 *and store those inputs in a custom variable.
 * Commands to control input and display responses are provided.
 *
 * -----------------------------------------------------------------------------
 * Plugin Commands:
 * -----------------------------------------------------------------------------
 *
 * InputWithImage <variableId> <placeholderText> <actorImage> <actorImageIndex>
 * - Opens an input window where the player can type a response.
 * - Arguments:
 *     - variableId: (Required) The game variable ID to store the player's input text.
 *     - placeholderText: (Optional) Placeholder text displayed before typing.
 *     - actorImage: (Optional) Actor face image name in img/faces/ to display.
 *     - actorImageIndex: (Optional) Index of the face in the actor image file.
 *
 * Usage Example:
 * InputWithImage 19 "What's your name?" Actor1 0
 * 
 * 
 * InputBlank <variableId> <placeholderText>
 * - Opens an input window for text entry without any actor image.
 * - Arguments:
 *     - variableId: (Required) The game variable ID to store the player's input.
 *     - placeholderText: (Optional) Placeholder text displayed before typing.
 *
 * Usage Example:
 * InputBlank 19 "Your favorite color?"
 *
 * 
 * DisplayResponse <variableId> <actorImage> <actorImageIndex>
 * - Displays the stored text from a variable in the message window with an optional actor image.
 * - Arguments:
 *     - variableId: (Required) The game variable ID from which to display the stored text.
 *     - actorImage: (Optional) Actor face image name in img/faces/ to display.
 *     - actorImageIndex: (Optional) Index of the face in the actor image file.
 *
 * Usage Example:
 * displayResponse 19 Actor1 0
 *
 * -----------------------------------------------------------------------------
 */

(function() {
    var pluginCommands = {
        'InputWithImage': function(args) {
            var inputVariable = parseInt(args[0], 10) || 19;
            var placeholderText = args.slice(1, args.length - 2).join(' ') || "Enter your message...";
            var actorFaceImage = args[args.length - 2] || '';
            var actorFaceImageIndex = parseInt(args[args.length - 1], 10) || 0;

            // Set the actor image if provided
            $gameMessage.setFaceImage(actorFaceImage, actorFaceImageIndex);
            $gameMessage.add(placeholderText);

            // Block event progression until input is completed
            $gameMessage._isUserInputComplete = false;

            var scene = SceneManager._scene;
            if (scene instanceof Scene_Map) {
                var messageWindow = scene._messageWindow;
                if (messageWindow) {
                    messageWindow.prepareInputWindow(inputVariable, actorFaceImage, actorFaceImageIndex, placeholderText);
                    setTimeout(function() {
                        messageWindow.activateInput();
                    }, 100);
                }
            }

            // Set the waiting flag to true so events halt until input is received
            $gameSystem._isWaitingForInput = true;
        },

        'InputBlank': function(args) {
            var inputVariable = parseInt(args[0], 10) || 19;
            var placeholderText = args.slice(1).join(' ') || "Enter your message...";

            // No actor image here, so clear it
            $gameMessage.setFaceImage('', 0);
            //$gameMessage.add(placeholderText);

            // Block event progression until input is completed
            $gameMessage._isUserInputComplete = false;

            var scene = SceneManager._scene;
            if (scene instanceof Scene_Map) {
                var messageWindow = scene._messageWindow;
                if (messageWindow) {
                    messageWindow.prepareInputWindow(inputVariable, '', 0, placeholderText);
                    setTimeout(function() {
                        messageWindow.activateInput();
                    }, 100);
                }
            }

            // Set the waiting flag to true so events halt until input is received
            $gameSystem._isWaitingForInput = true;
        },
		'DisplayResponse': function(args) {
            var variableId = parseInt(args[0], 10); // Required variableId
            var actorImage = args[1] || '';         // Optional actorImage
            var actorImageIndex = parseInt(args[2], 10) || 0; // Optional actorImageIndex

            // Retrieve the text from the specified variable
            var responseText = $gameVariables.value(variableId) || "No text found";

            // Set the face image if actorImage is provided, otherwise clear it
            if (actorImage) {
                $gameMessage.setFaceImage(actorImage, actorImageIndex);
            } else {
                $gameMessage.setFaceImage('', 0); // Clear face image if none provided
            }

            // Add the response text to display in the message window
            $gameMessage.add(responseText);
        }
    };
	
	

    // Register the plugin commands
    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (pluginCommands[command]) {
            pluginCommands[command](args);
        }
    };

    // Override the updateWaitMode method to block events until user input is completed
    var _Game_Interpreter_updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
    Game_Interpreter.prototype.updateWaitMode = function() {
        if ($gameSystem._isWaitingForInput) {
            return !$gameMessage._isUserInputComplete;
        }
        return _Game_Interpreter_updateWaitMode.call(this);
    };

    // Prepare the input window for user interaction
    Window_Message.prototype.prepareInputWindow = function(inputVariable, actorFaceImage, actorFaceImageIndex, placeholderText) {
        console.log("Preparing input window with:", inputVariable, actorFaceImage, actorFaceImageIndex, placeholderText);

        this._inputVariable = inputVariable;
        this._actorFaceImage = actorFaceImage;
        this._actorFaceImageIndex = actorFaceImageIndex;
        this._inputLines = ['']; // Initialize the input lines
        this._inputActive = true;
        this._placeholderText = placeholderText;

        this.open();
        this.refreshInputWindow();

        // Mark input as not complete, blocking event processing
        $gameMessage._isUserInputComplete = false;
    };

    // Activate the input method for user input
	Window_Message.prototype.activateInput = function() {
		console.log("Activating input...");

		if (!this._inputActive) return;

		// Save the original key mappings and set the custom key mapping for input
		this._originalKeyMapper = Object.assign({}, Input.keyMapper);
		this._overrideKeyMapperForTextInput();

		// Bind and add event listeners for keyboard and mouse
		this._boundHandleInput = this.handleInput.bind(this);
		document.addEventListener('keydown', this._boundHandleInput);

		// Add mouse click event for closing on click
		this._boundHandleMouseClick = this.handleMouseClick.bind(this);
		document.addEventListener('mousedown', this._boundHandleMouseClick);

		this._lastInputTime = 0;
		this.refreshInputWindow();
	};
	
	// Handle mouse click to close the window
	Window_Message.prototype.handleMouseClick = function(event) {
		console.log("Mouse click detected, deactivating input...");
		this._inputLines = [''];  // Clear input text
		this.deactivateInput();    // Deactivate input and clear the waiting state
		event.preventDefault();
	};
	
    // Override key mapper for text input
    Window_Message.prototype._overrideKeyMapperForTextInput = function() {
        Input.keyMapper[32] = 'space';
        Input.keyMapper[90] = 'z';
        Input.keyMapper[88] = 'x';
        Input.keyMapper[87] = 'w';
        Input.keyMapper[80] = 'p';
    };


    // Process input after typing
    Window_Message.prototype.processInput = function() {
        var inputText = Number(this._inputLines.join('').trim());
        console.log("Processed input:", inputText);
        $gameVariables.setValue(this._inputVariable, inputText);

        // Mark user input as complete, allowing event processing to resume
        $gameMessage._isUserInputComplete = true;
        $gameSystem._isWaitingForInput = false; // Allow events to proceed

        this.deactivateInput();
        this.close();
    };

    // Deactivate input after input is processed or canceled
	Window_Message.prototype.deactivateInput = function() {
		console.log("Deactivating input...");

		// Remove the keydown and mousedown event listeners
		document.removeEventListener('keydown', this._boundHandleInput);
		document.removeEventListener('mousedown', this._boundHandleMouseClick);

		// Restore the original key mapping
		Input.keyMapper = this._originalKeyMapper;

		// Set input active state to false and close the window
		this._inputActive = false;
		this.close();

		// Ensure the game stops waiting for input
		$gameSystem._isWaitingForInput = false;
	};

	// Handle user input (text or cancel)
	Window_Message.prototype.handleInput = function(event) {
		if (!this._inputActive || !this.isOpen()) return;

		var currentLineIndex = this._inputLines.length - 1;
		var currentLine = this._inputLines[currentLineIndex];

		console.log("Handling input:", event.key, "Current line:", currentLine);

		if (event.key === 'Enter') {
			// "OK" button press (Enter): Process input
			this.processInput();
			event.preventDefault();
		} else if (event.key === 'Backspace') {
			// Handle Backspace: Remove characters
			if (currentLine.length > 0) {
				this._inputLines[currentLineIndex] = currentLine.slice(0, -1);
			} else if (this._inputLines.length > 1) {
				this._inputLines.pop();
			}
			this.refreshInputWindow();  // Refresh window on Backspace
		} else if (event.key === 'Escape') {
			// "Cancel" button press (Escape): Clear input and close
			this._inputLines = [''];  // Clear input
			this.refreshInputWindow();  // Refresh window to show empty input
			this.deactivateInput();     // Deactivate input and stop waiting for input
			event.preventDefault();
		} else if (event.key.length === 1) {
			// Add characters to the current line
			if (currentLine.length < 40) {
				this._inputLines[currentLineIndex] += event.key;
			} else if (this._inputLines.length < 4) {
				this._inputLines.push(event.key);
			}
			this.refreshInputWindow();  // Refresh window as user types
		}

		// Block propagation for "space" or "z"
		if (event.key === ' ' || event.key === 'z') {
			event.stopPropagation();
			event.preventDefault();
		}
	};



    // Refresh the input window display
	Window_Message.prototype.refreshInputWindow = function() {
    if (!this._inputLines) return;

    console.log("Refreshing input window...");

    // Clear previous content
    this.contents.clear();

    // Initialize variables for face image width and text starting position
    var faceImageWidth = 0;
    var textStartX = 0;

    // Check if the face image is valid and ready
    if (this._actorFaceImage) {
        console.log("Face image is available:", this._actorFaceImage);
        faceImageWidth = Window_Base._faceWidth;  // Use the actual face image width
        textStartX = faceImageWidth + 10; // Space after the face image
    } else {
        console.log("No actor face image set.");
    }

    var textStartY = 0; // Text starting position

    // Log the calculated text start position
    console.log("Calculated text position:", textStartX, textStartY);

    // If the face image exists, draw it
    if (this._actorFaceImage) {
        this.drawFace(this._actorFaceImage, this._actorFaceImageIndex, 0, textStartY);
        console.log("Drawing face image.");
    }

    // Draw the typed text after the face image
    var text = this._inputLines.join('');
	if (!text) {
		this.changeTextColor(this.textColor(7));
		text = this._placeholderText;
	}
    console.log("Text to be rendered:", text);

    this.contents.drawText(text, textStartX, textStartY, this.contents.width - textStartX - 10, this.lineHeight(), 'left');
    console.log("Text rendered:", text);
};

})();

