FREQ_TBL = [16.352, 17.324, 18.354, 19.445, 20.601, 21.826, 23.124, 24.500, 25.956, 27.500, 29.135, 30.867];
CHANNELS_AMT = 11;

/* song = {
speed:2,
ch:[ " 4defgecd", " 4abcdbga" ]} */

soundInitted = false;
//muted = [true, false, true, true, true, true, true, true, true, true]
muted = [];

loadedSong = {
	time:0,
	ch: [],
	currentIndex: [],
	length: 0
}

var soundPlayerInit = function () {

	audioCtx = new (window.AudioContext || window.webkitAudioContext)();
	masterGainNode = audioCtx.createGain();
	masterGainNode.gain.value = 0.1;
	masterGainNode.connect(audioCtx.destination);
	
	oscs = [4];
	
	// init oscillator notes
	for (i = 0; i < CHANNELS_AMT; i++){
		oscs[i] = audioCtx.createOscillator();
		oscs[i].connect(masterGainNode);
		oscs[i].type = 'triangle';
		
		oscs[i].frequency.setValueAtTime(0, audioCtx.currentTime); //init oscs with 0 freq
		
		oscs[i].start();
		muted[i] = false;
	}
	
	soundInitted = true;
	loadSong(song_EMPTY);
}

var loadSong = function (song) {
	for (i = 0; i < CHANNELS_AMT; i++){ // init blank channels
		loadedSong.ch[i] = { pitches:[], times:[] };
		loadedSong.currentIndex[i] = 0;
		
		loadedSong.time = 0;
		loadedSong.length = 0;
		loadedSong.loop = song.loop;
		oscs[i].frequency.setValueAtTime(0, audioCtx.currentTime); // pauses playback while sounds are loading
	}
	
	for (i = 0; i < CHANNELS_AMT; i++){
		time = 0;
		octave = 4;
		rhythm = 0;
		note = -1;
		
		chData = song.ch[i];
		hasRhythm = false;
		
		if (chData){
			for (j = 1; j < chData.length; j++){
			
				hasNote = false;
				currentChar = chData.substring(j, j+1);
				
				switch (currentChar){
				
					case "-":
						octave--;
						octave = Math.max(0, octave);
						break;
					case "+":
						octave++;
						octave = Math.min(8, octave);
						break;
					case "c":
						note = 0;hasNote = true;
						break;
					case "d":
						note = 2;hasNote = true;
						break;
					case "e":
						note = 4;hasNote = true;
						break;
					case "f":
						note = 5;hasNote = true;
						break;
					case "g":
						note = 7;hasNote = true;
						break;
					case "a":
						note = 9;hasNote = true;
						break;
					case "b":
						note = 11;hasNote = true;
						break;
					case "r":
						note = -1;hasNote = true;
						break;
					case "#":
						break;
						
					default:
						fullSub = chData.substring(j);
						if (parseInt(fullSub, 10) != NaN && !hasRhythm){
							
							rhythm = parseInt(fullSub, 10) * song.speed;
							hasRhythm = true;
						}
				}
				if (hasNote){
					hasRhythm = false;
				
					if (note == -1){
						loadedSong.ch[i].pitches.push(-1);
					}else{
					
						nextChar = chData.substring(j+1, j+2);
						if (nextChar == "#"){
							note = (note + 1) % 12;
						}
					
						octaveMult = Math.pow(2, octave);
						freq = FREQ_TBL[note] * octaveMult;
						loadedSong.ch[i].pitches.push(freq);
					}
					loadedSong.ch[i].times.push(time);
					time += rhythm;
					
					hasNote = false;
				}
			}
		}

		if (time > loadedSong.length){
			loadedSong.length = time;
		}
	}
}

var soundPlayerTick = function () {

	if (soundInitted && document.hasFocus()){
		for (i = 0; i < CHANNELS_AMT; i++){
			
			ls = loadedSong.ch[i];
	
			for (j=0; j < ls.pitches.length; j++){
				if (ls.times[j] == loadedSong.time) {
				
					if (ls.pitches[j] == -1){
						oscs[i].frequency.setValueAtTime(0, audioCtx.currentTime);
					}else{
						oscs[i].frequency.setValueAtTime( ls.pitches[j] , audioCtx.currentTime);
					}
				}
			}
		}

		loadedSong.time++;
		if (loadedSong.time > loadedSong.length && loadedSong.loop){
			loadedSong.time = 0;
		}
	}
}