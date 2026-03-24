using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SecureExam.API.Migrations
{
    /// <inheritdoc />
    public partial class AddBiometricData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BaselineSignatures_Users_UserId",
                table: "BaselineSignatures");

            migrationBuilder.DropIndex(
                name: "IX_BaselineSignatures_UserId",
                table: "BaselineSignatures");

            migrationBuilder.RenameColumn(
                name: "ReferenceSentence",
                table: "BaselineSignatures",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "AverageFlightTime",
                table: "BaselineSignatures",
                newName: "MeanFlight");

            migrationBuilder.RenameColumn(
                name: "AverageDwellTime",
                table: "BaselineSignatures",
                newName: "MeanDwell");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "MeanFlight",
                table: "BaselineSignatures",
                newName: "AverageFlightTime");

            migrationBuilder.RenameColumn(
                name: "MeanDwell",
                table: "BaselineSignatures",
                newName: "AverageDwellTime");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "BaselineSignatures",
                newName: "ReferenceSentence");

            migrationBuilder.CreateIndex(
                name: "IX_BaselineSignatures_UserId",
                table: "BaselineSignatures",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_BaselineSignatures_Users_UserId",
                table: "BaselineSignatures",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
