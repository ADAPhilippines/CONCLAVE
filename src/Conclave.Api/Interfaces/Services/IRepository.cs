namespace Conclave.Api.Interfaces;


public interface IRepository<Type, Key> where Type : class
{
    public Type? GetById(Key id);
    public IEnumerable<Type>? GetAll();
    public Task<Type> CreateAsync(Type entity);
    public Task<Type?> UpdateAsync(Key id, Type entity);
    public Task<Type?> DeleteAsync(Key id);
}