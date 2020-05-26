FREQ_TBL = [16.352, 17.324, 18.354, 19.445, 20.601, 21.826, 23.124, 24.500, 25.956, 27.500, 29.135, 30.867];
CHANNELS_AMT = 4;

song = {
	speed: 2,
	ch: [
		" 4--a#r+frar+drcr-grer-ar++",
		" 32dc",
		" 32fe"
	]
}
soundInitted = false;

var soundPlayerInit = function () {

	notes = [4];
	octaves = [4];
	volumes = [4];
	lengths = [4];
	noteTicks = [4];

	audioCtx = new (window.AudioContext || window.webkitAudioContext)();
	masterGainNode = audioCtx.createGain();
	masterGainNode.gain.value = 0.3;
	masterGainNode.connect(audioCtx.destination);
	
	oscs = [4];
	
	currentChar = [4]; // used for mml parsing
	
	// init oscillator notes
	for (i = 0; i < CHANNELS_AMT; i++){
		oscs[i] = audioCtx.createOscillator();
		oscs[i].connect(masterGainNode);
		oscs[i].type = 'triangle';

		noteTicks[i] = 0;
		currentChar[i] = 0;
		octaves[i] = 4;
		lengths[i] = 0;
		
		oscs[i].frequency.setValueAtTime(0, audioCtx.currentTime); //init oscs with 0 freq
		
		oscs[i].start();
	}
	
	soundInitted = true;
}

var soundPlayerTick = function () {
	
	if (soundInitted){
		for (i = 0; i < song.ch.length; i++){
			
			if (noteTicks[i] == 0){
				
				hasNote = false;
				hasRhythm = false;
				chData = song.ch[i];
				for (j = 1; j < chData.length; j++){
				
					offsetIndex = (currentChar[i] + j) % (chData.length);
					offsetChar = chData.substring(offsetIndex, offsetIndex+1);
			
					switch (offsetChar){
					
						case "-":
							octaves[i]--;
							octaves[i] = Math.max(0, octaves[i]);
							break;
						case "+":
							octaves[i]++;
							octaves[i] = Math.min(8, octaves[i]);
							break;
						case "c":
							notes[i] = 0;hasNote = true;
							break;
						case "d":
							notes[i] = 2;hasNote = true;
							break;
						case "e":
							notes[i] = 4;hasNote = true;
							break;
						case "f":
							notes[i] = 5;hasNote = true;
							break;
						case "g":
							notes[i] = 7;hasNote = true;
							break;
						case "a":
							notes[i] = 9;hasNote = true;
							break;
						case "b":
							notes[i] = 11;hasNote = true;
							break;
						case "r":
							notes[i] = -1;hasNote = true;
							break;
							
						default:
							fullSub = chData.substring(offsetIndex);
							if (parseInt(fullSub, 10) != NaN && !hasRhythm){
								//console.log(offsetChar + " " + i);
								lengths[i] = parseInt(fullSub, 10) * song.speed;
								hasRhythm = true;
							}
							break;
					}
					
					if (hasNote){
						
						hasRhythm = false;
						
						currentChar[i] = offsetIndex;
						nextChar = chData.substring(offsetIndex+1, offsetIndex+2);
						if (nextChar == "#"){
							notes[i] = (notes[i] + 1) % 12;
							currentChar[i]++;
						}
						if (notes[i] == -1){ // note cut
							oscs[i].frequency.setValueAtTime(0, audioCtx.currentTime);
							
						}else{
							octaveMult = Math.pow(2, octaves[i])
							freq = FREQ_TBL[notes[i]] * octaveMult ;
							
							oscs[i].frequency.setValueAtTime(freq, audioCtx.currentTime);
						}
						
						noteTicks[i] = lengths[i] - 1;
					
						break;
					}
				}
			
			} else {
			
				noteTicks[i]--;
				
			}
		}
	}
}