<?php

session_start();

if(!isset($_SESSION['count']))
	$_SESSION['count'] = 0;


$all_sessions = array();


$_SESSION[session_id()];


foreach($_SESSION as $key => $value)
{

	echo $key . '<br/>';

}

$json = json_encode($All_Sessions);

echo sizeof($_SESSION);

class Game
{

	public $match_up = array();
	public $player_waiting = NULL;

	public function new_player($id)
	{

		if($this->player_waiting == NULL)
		{

			$this->player_waiting = new Player_Data($id);

		}else{

			$this->add_match(array($this->player_waiting, new Player_Data($id)));
			$this->player_waiting = NULL;

		}

	}

	public function add_match($players)
	{

		// Sets whose turn it is
		array_push($players, 0);

		// Adds the match
		array_push($this->match_up, $players);

	}

}

class Player_Data
{

	public $still_here = 0;
	public $count_down = 5;
	public $my_session_id;
	public $opponent_last_here_value = 0;

	public function __construct($id)
	{

		$this->my_session_id = $id;
	
	}

}


?>