import {Avatar, ListItemAvatar, ListItemText, Paper, Typography} from "@mui/material";
import {useCallback, useEffect, useState} from "react";
import {Song} from "../../src/interfaces/song";

export function NowPlaying() {
	const [song, setSong] = useState<Song>({} as Song);

	const updateCurrentSong = useCallback(async () => {
		const response = await fetch('/api/currentSong');
		const data = await response.json();
		if (!data) {
			return;
		}

		setSong(data || {});
	}, []);

	useEffect(() => {
		setInterval(updateCurrentSong, 5000);
	}, [updateCurrentSong])

	const parseDuration = (ptDuration: string) => {
		return ptDuration?.replace("PT","").replace("H",":").replace("M",":").replace("S","");
	}

	return (<Paper elevation={2} sx={{ width: '33%', bgcolor: 'background.paper' }}>
		<Typography sx={{ display: 'inline' }} component="span" variant="h4" color="text.primary">
			Now playing
		</Typography>

		<Paper elevation={0}>
				<ListItemAvatar><Avatar sx={{ width: 216, height: 216, display: 'block', margin: '5px' }} variant="square" src={ song.snippet.thumbnails.standard.url }/></ListItemAvatar>
			<ListItemText primary={ song.snippet.title } secondary={ song.snippet.channelTitle }/>
			<ListItemText primary={'Duration: ' + parseDuration(song.contentDetails.duration) }/>
		</Paper>
	</Paper>);
}