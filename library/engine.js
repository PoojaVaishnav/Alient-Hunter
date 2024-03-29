//Game engine class
function Game(width, height, setup, assetsToLoad, load){
	
		//Make the canvas and initialize the stage
		this.canvas = makeCanvas(width, height, "none");
		this.canvas.style.backgroundColor = "white";
		stage.width = this.canvas.width;
		stage.height = this.canvas.height;
		
		//Make the pointer
		this.pointer = makePointer(this.canvas);
		//The game's scale
		this.scale = 1;
		//Set the game `state`
		this.state = undefined;
		//Set the user-defined `load` and `setup` states
		this.load = load;
		this.setup = setup;
		//Get a reference to the `assetsToLoad` array
		this.assetsToLoad = assetsToLoad;
		//A Boolean to let us pause the game
		this.paused = false;
		
		//Variables for interpolation
		this.fps = 15,
		this.previous = 0,
		this.frameDuration = 1000 / this.fps,
		this.lag = 0;
		_this = this;

		//The `setup` function is required, so throw an error if it's//missing
		if (!setup) {
			throw new Error("Please supply the setup function in the constructor");
		}
}
Game.prototype = {
	//The game loop
	gameLoop: function(timestamp){
		
		requestAnimationFrame(this.gameLoop.bind(this));
		
		//Calculate the time that has elapsed since the last frame
		if (!timestamp) timestamp = 0;
		var elapsed = timestamp - this.previous;
		
		//Optionally correct any unexpected huge gaps in the elapsed time
		if (elapsed > 1000) elapsed = this.frameDuration;
		//Add the elapsed time to the lag counter
		this.lag += elapsed;
		
		//Update the frame if the lag counter is greater than or
		//equal to the frame duration
		while (this.lag >= this.frameDuration) {			
			capturePreviousPositions(stage);			
			
			//Run the current game `state` function if it's been defined and
			//the game isn't `paused`
			if(this.state && !this.paused){
				this.state();				
			}
			//Reduce the lag counter by the frame duration
			this.lag -= this.frameDuration;
		}	
		//update game tween, shaking sprites, particle effect
		this.updateGameEffects();
		//Calculate the lag offset. This tells us how far
		//we are into the next frame
		var lagOffset = this.lag / this.frameDuration;
		//Render the sprites using the `lagOffset` to
		//interpolate the sprites' positions
		renderWithInterpolation(this.canvas, lagOffset);
		//Capture the current time to be used as the previous
		//time in the next frame
		this.previous = timestamp;
	},
	//The `start` method that gets the whole engine going. This needs to
	//be called by the user from the game application code, right after
	//the engine is instantiated
	start: function(){
		if (this.assetsToLoad){
			//Use the supplied file paths to load the assets, and then run
			//the user-defined `setup` function
			setTimeout(
				function(){
					assets.load(_this.assetsToLoad,
						function(){
									//Clear the game `state` function for now to stop the loop
									_this.state = undefined;
									//Call the `setup` function that was supplied by the user in
									//the Game class�s constructor
									_this.setup();
								});
				}
			,0);
			//While the assets are loading, set the user-defined `load`
			//function as the game state. That will make it run in a loop.
			//You can use the `load` state to create a loading progress bar
			
			if (this.load){
				this.state = this.load;
			}
		}
		//If there aren't any assets to load,
		//just run the user-defined `setup` function
		else {
			this.setup();
		}
		//Start the game loop
		this.gameLoop();
	},
	//Pause and resume methods. These stop and start the
	//game engine's game loop
	pause: function(){
		this.paused = true;
	},
	resume: function(){
		this.paused = false;
	},
	scaleToWindow: function(backgroundColor){
		var backgroundColor = checkIfUndefined(backgroundColor,"#2C3539");
		
		var scaleX, scaleY, scale, center;
		//1. Scale the canvas to the correct size
		//Figure out the scale amount on each axis
		scaleX = window.innerWidth / this.canvas.width;
		scaleY = window.innerHeight / this.canvas.height;
		//Scale the canvas based on whichever value is less: `scaleX` or `scaleY`
		scale = Math.min(scaleX, scaleY);
		scale = Math.round(scale);
		this.canvas.style.transformOrigin = "0 0";
		this.canvas.style.transform = "scale(" + scale + ")";
		//2. Center the canvas.
		//Decide whether to center the canvas vertically or horizontally.
		//Wide canvases should be centered vertically, and
		//square or tall canvases should be centered horizontally
		if (this.canvas.width > this.canvas.height){
			center = "vertically";
		} else {
			center = "horizontally";
		}
		//Center horizontally (for square or tall canvases)
		if (center === "horizontally"){		
			var margin =(window.innerHeight - this.canvas.height * scaleX) / 2;
			this.canvas.style.marginTop = margin + "px";
			this.canvas.style.marginBottom = margin + "px";
		}
		//Center vertically (for wide canvases)
		if (center === "vertically"){
			var margin = (window.innerWidth - this.canvas.width * scaleY) / 2;
			this.canvas.style.marginLeft = margin + "px";
			this.canvas.style.marginRight = margin + "px";
		}
		//3. Remove any padding from the canvas and set the canvas
		//display style to "block"
		this.canvas.style.paddingLeft = 0;
		this.canvas.style.paddingRight = 0;
		this.canvas.style.display = "block";
		//4. Set the color of the HTML body background
		document.body.style.backgroundColor = backgroundColor;
		//5. Set the game engine ("this") and the pointer to the correct scale.
		//This is important for correct hit testing between the pointer and sprites
		this.pointer.scale = scale;
		this.scale = scale;
	},
	updateGameEffects: function(){
		//Update the game logic
		//Update all the buttons
		if (buttons.length > 0){
			this.canvas.style.cursor = "auto";
			buttons.forEach(function(button){
				button.update(this.pointer, this.canvas);
				if (button.state === "over" || button.state === "down") {
					if(button.parent !== undefined) {
						this.canvas.style.cursor = "pointer";
					}
				}
			},this);
		}
		//Update all the particles
		if (particles.length > 0){
			for(var i = particles.length - 1; i >= 0; i--) {
				var particle = particles[i];
				particle.update();
			}
		}
		//Update all the tweens
		if (tweens.length > 0){
			for(var i = tweens.length - 1; i >= 0; i--){
				var tween = tweens[i];
				if (tween) 
					tween.update();
			}
		}
		//Update all the shaking sprites
		//(More about this later in the chapter!)
		if (shakingSprites.length > 0){
			for(var i = shakingSprites.length - 1; i >= 0; i--) {
				var shakingSprite = shakingSprites[i];
				if (shakingSprite.updateShake) 
						shakingSprite.updateShake();
			}
		}
		//Update the pointer for drag-and-drop
		if (draggableSprites.length > 0){
			this.pointer.updateDragAndDrop(draggableSprites);
		}
	}
};

function game(width, height, setup, assetsToLoad, load){
	var width = checkIfUndefined(width,256),
		height = checkIfUndefined(height,256);
	return new Game(width, height, setup, assetsToLoad, load);
}

function capturePreviousPositions(stage){
	//Loop through all the children of the stage
	stage.children.forEach(function(sprite){
		setPreviousPosition(sprite);
	});
	function setPreviousPosition(sprite){
		//Set the sprite�s `previousX` and `previousY`
		sprite.previousX = sprite.x;
		sprite.previousY = sprite.y;
		//Loop through all the sprite's children
		if (sprite.children && sprite.children.length > 0){
				sprite.children.forEach(function(child){
				//Recursively call `setPosition` on each sprite
				setPreviousPosition(child);
			});
		}
	}
}