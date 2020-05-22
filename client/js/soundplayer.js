var soundTest = function () {

	var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

	// create Oscillator node
	var oscillator = audioCtx.createOscillator();
	oscillator.connect(audioCtx.destination);

	oscillator.type = 'triangle';
	oscillator.volume = 0.5;
	oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // value in hertz
	oscillator.start();
}