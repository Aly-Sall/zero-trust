namespace SecureExam.API.DTOs
{
    public class KeystrokeDataDto
    {
        public string Key { get; set; } = string.Empty;
        public double DwellTime { get; set; }
        public double FlightTime { get; set; }
        public double Timestamp { get; set; }
    }
}