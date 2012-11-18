#!/bin/sh
tmux new-session -s crawl -d 'node analyzer.js'
tmux new-window -t crawl:1 'node host-picker.js'
tmux new-window -t crawl:2 'node html-stripper.js'
for (( i = 3; i < 4; i++ )); do
	tmux new-window -t crawl:$i 'node crawl2.js'
done
tmux -2 attach-session -t crawl
