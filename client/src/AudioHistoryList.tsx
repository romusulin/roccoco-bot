import {Avatar, Divider, List, ListItem, ListItemAvatar, ListItemText, Paper, Typography} from "@mui/material";
import {useCallback, useEffect, useState} from "react";
import {Song} from "../../src/interfaces/song";

export function AudioHistoryList() {
	const [songList, setSongList] = useState<Song[]>([]);

	const updateHistory = useCallback(async () => {
		const response = await fetch('/api/history');
		const data = await response.json();
		if (!data.length) {
			return;
		}

		setSongList(data?.reverse() || []);
	}, []);

	useEffect(() => {
		setInterval(updateHistory, 5000);
	}, [updateHistory])

	const parseDuration = (ptDuration: string) => {
		return ptDuration?.replace("PT","").replace("H",":").replace("M",":").replace("S","");
	}

	return (<Paper elevation={2} sx={{ width: '33%', bgcolor: 'background.paper' }}>
		<Typography sx={{ display: 'inline' }} component="span" variant="h4" color="text.primary">
			Audio history
		</Typography>
		<List sx={{height: '100%'}}>
			{
				songList.map((song, index) => {
					return (
						<Paper elevation={0}>
						<ListItem alignItems="flex-start">
								<ListItemAvatar><Avatar sx={{ width: 86, height: 86, display: 'block', margin: '5px' }} variant="square" src={ song.snippet.thumbnails.standard.url }/></ListItemAvatar>
							<ListItemText primary={ song.snippet.title } secondary={ song.snippet.channelTitle }/>
							<ListItemText primary={'Duration: ' + parseDuration(song.contentDetails.duration) }/>
						</ListItem>
						{ index < (songList.length - 1) ? <Divider variant="inset" component="li" /> : '' }
						</Paper>
					);
				})
			}
		</List>
	</Paper>);
}