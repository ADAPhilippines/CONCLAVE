namespace Conclave.Oracle.Node.Services.Interfaces;

interface IBrowserService
{
    Task WaitBrowserReadyAsync();
}