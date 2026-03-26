using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace SecureExam.API.Hubs
{
    public class MonitoringHub : Hub
    {
        public async Task ReportCheat(object alertData)
        {
            await Clients.All.SendAsync("ReceiveAlert", alertData);
        }

        // 🚀 WE NOW ACCEPT THE STUDENT EMAIL
        public async Task SendVideoFrame(string sessionId, string studentEmail, string frameData)
        {
            await Clients.Others.SendAsync("ReceiveVideoFrame", new { sessionId, studentEmail, frameData });
        }

        // 🚀 WE PASS THE EMAIL TO KNOW EXACTLY WHICH CAMERA TO KILL
        public async Task StopVideoFrame(string sessionId, string studentEmail)
        {
            await Clients.Others.SendAsync("RemoveVideoFrame", new { sessionId, studentEmail });
        }
    }
}