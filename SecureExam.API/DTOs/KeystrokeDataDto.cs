using System.Collections.Generic;

namespace SecureExam.API.DTOs
{
    public class KeystrokeDataDto
    {
        public string Key { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty; // "keydown" or "keyup"
        public long Timestamp { get; set; }
    }

    public class BiometricPayload
    {
        public string StudentEmail { get; set; } = string.Empty;
        public List<KeystrokeDataDto> Events { get; set; } = new();
    }
}