using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FrenCircle.Entities;

public class Profile
{
    [Key]
    [ForeignKey(nameof(User))]
    public Guid UserId { get; set; }

    [Required]
    [Column(TypeName = "citext")]
    public string Username { get; set; } = null!;

    public string? DisplayName { get; set; }

    public string? Bio { get; set; }

    public string? AvatarUrl { get; set; }

    public string? Timezone { get; set; }

    public string? Locale { get; set; }

    // Navigation property
    public User User { get; set; } = null!;
}