namespace PersonalChess.Domain.Models;

public class Position
{
    public int Rank { get; set; } // Linha (0-7)
    public int File { get; set; } // Coluna (0-7)

    public Position(int rank, int file)
    {
        Rank = rank;
        File = file;
    }

    public override bool Equals(object obj)
    {
        if (obj is Position other)
        {
            return Rank == other.Rank && File == other.File;
        }
        return false;
    }

    public override int GetHashCode()
    {
        return HashCode.Combine(Rank, File);
    }
}