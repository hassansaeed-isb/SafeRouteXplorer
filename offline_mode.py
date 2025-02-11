from incident_loader import IncidentLoader

class OfflineMode:
    """Handles offline mode by loading incidents without Google Maps API"""

    def __init__(self, csv_file_path: str = "1improved_processed_road_safety_tweets.csv"):
        """
        Initialize offline mode using IncidentLoader.
        """
        self.incident_loader = IncidentLoader(csv_file_path)

    def get_offline_incidents(self):
        """Return the same incident data used for online mode."""
        return self.incident_loader.get_incidents()
