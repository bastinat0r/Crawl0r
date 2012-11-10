#!/bin/sh
tmux new-session -s crawl -d 'node analyzer.js'
tmux new-window -t crawl:1 'node host-picker.js'
tmux new-window -t crawl:2 'node html-stripper.js'
tmux new-window -t crawl:3 'node crawl2.js'
tmux -2 attach-session -t crawl
