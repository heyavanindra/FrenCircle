namespace FrenCircle.Infra
{
    public interface ICloudinaryService
    {
        Task<CloudinaryUploadResult> UploadImageAsync(Stream fileStream, string fileName, string contentType, CancellationToken cancellationToken = default);
        Task<CachedImageResult?> GetImageAsync(string publicId, CancellationToken cancellationToken = default);
    }

    public sealed record CloudinaryUploadResult(string PublicId, string Url, string LocalPath);

    public sealed record CachedImageResult(string FilePath, string ContentType, string FileName);
}
