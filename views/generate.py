map = {
	1 : "donec.tempus@google.edu",
	2 : "elementum.sem@hotmail.org",
	3 : "facilisis.non.bibendum@protonmail.org",
	4 : "nec.ante@aol.com",
	5 : "ac.mattis@hotmail.couk",
	6 : "adipiscing.elit@outlook.com",
	7 : "ligula.aliquam@aol.couk",
	8 : "dictum.eleifend.nunc@protonmail.net",
	9 : "porttitor.scelerisque@aol.edu",
	10 : "libero.integer@icloud.ca",
	11 : "nec@google.org",
	12 : "varius.ultrices@google.net",
	13 : "nulla.aliquet.proin@protonmail.net",
	14 : "suscipit.est@hotmail.org",
	15 : "lorem.auctor.quis@aol.com",
	16 : "phasellus@outlook.edu",
	17 : "massa.integer@icloud.couk",
	18 : "mauris.aliquam@outlook.com",
	19 : "purus.maecenas.libero@aol.org",
	20 : "sollicitudin.commodo@yahoo.com"
}

def generate_email(id):
	return map[id]

n = 50
m = 0
ans_lis = []
for i in range(1, n+1):
	lis = input().split(',')
	lis[4] = generate_email(int(lis[4]))
	ans = "("+lis[0]+","+lis[1]+","+lis[2]+","+lis[3]+",\""+lis[4]+"\");"
	ans_lis.append(ans)

for i in range(1, n+1):
	print(ans_lis[i-1])

