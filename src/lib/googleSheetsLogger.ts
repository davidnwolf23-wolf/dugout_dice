
export interface GameLog {
    session_id: string;
    inning_id: string;
    player_number: number;
    session_inning_number: number;
    inning_roll_number: number;
    game_phase: 'b' | 'h' | 'p' | 'PITCHING' | 'HITTING' | 'SETUP' | 'PAYOUT'; // Adjusted to match store types
    outs: number;
    run_total_before: number;
    first: number;
    second: number;
    third: number;
    inning_win_bet: number;
    pitching_side_bet: number;
    hitting_side_bet: number;
    strike_zone_bet: number;
    batter_up_bet: number;
    hit_type: string;
    timestamp: string;
}

/**
 * Sends a batch of game logs to the Google Apps Script Web App.
 * Uses 'no-cors' mode to avoid CORS errors, but this means we can't read the response.
 * We rely on the script execution being successful.
 */
export async function sendLogsToGoogleSheet(scriptUrl: string, logs: GameLog[]) {
    if (!scriptUrl || logs.length === 0) return;

    try {
        // Send as a POST request with the JSON payload
        await fetch(scriptUrl, {
            method: 'POST',
            mode: 'no-cors', // Important for Google Scripts
            body: JSON.stringify(logs),
            headers: {
                'Content-Type': 'application/json',
            },
        });
        console.log(`Sent ${logs.length} logs to Google Sheet`);
    } catch (error) {
        console.error('Failed to send logs to Google Sheet:', error);
    }
}
