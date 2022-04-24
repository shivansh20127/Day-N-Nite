n = 50
lis = []
for i in range(1, n+1):
	lis.append(input())

print(lis)
for i in range(1, n+1):
	s = lis[i-1]
	s = s[1:-2]
	print(s)
