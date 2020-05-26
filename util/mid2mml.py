from mido import *
from mido import MidiFile
import sys

path_in = sys.argv[1]
path_out = sys.argv[2]

midi_in = MidiFile(path_in)
file_out = open(path_out, "wb")

def main():

    track = midi_in.tracks[1]
    channels = []

    for msg in track:
        print(msg)

main()
