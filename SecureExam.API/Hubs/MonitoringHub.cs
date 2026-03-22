using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace SecureExam.API.Hubs
{
    public class MonitoringHub : Hub
    {
        // Cette méthode reçoit l'alerte de l'étudiant et l'envoie direct au Dashboard du Prof
        public async Task ReportCheat(object alertData)
        {
            await Clients.All.SendAsync("ReceiveAlert", alertData);
        }
    }
}